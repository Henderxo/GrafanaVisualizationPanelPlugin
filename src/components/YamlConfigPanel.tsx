import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import yaml from 'js-yaml';
import { PanelData } from '@grafana/data';
import { SimpleOptions } from 'types';
import createPanZoom from 'panzoom';

interface OtherViewPanelProps {
  options: SimpleOptions;
  data: PanelData;
}

interface YamlRule {
  id: string;
  match: MatchElement;
}

interface MatchElement {
  element: String
  if?: ConditionElement
  else_if?: ConditionElement[]
  else?: ConditionElement
}

interface ConditionElement {
  condition: string
  action: ActionElemenet
}

interface ActionElemenet{
  bind: BindElement[];
}

interface BindElement {
  variable: string;
}

interface Node {
  row?: number;
  value?: string;
  next?: Record<string, Node> | null;
}

export const OtherViewPanel: React.FC<OtherViewPanelProps> = ({ options, data }) => {
  const { yamlConfig, template } = options;
  const chartRef = useRef<HTMLDivElement>(null);

  if (!yamlConfig || !template) {
    return <div>Please provide both YAML rules and a Mermaid template.</div>;
  }

  let parsedYaml: any;
  try {
    parsedYaml = yaml.load(yamlConfig);
  } catch (e) {
    if (e instanceof Error) {
      return <div>Error parsing YAML: {e.message}</div>;
    } else {
      return <div>An unknown error occurred</div>;
    }
  }

  const rules: YamlRule[] = parsedYaml.rules || [];

  const table = data.series[0]?.fields.reduce((acc, field) => {
    acc[field.name] = field.values.toArray();
    return acc;
  }, {} as Record<string, any[]>);

  if (!table) return <div>No Data Available</div>;

  const rows = table[Object.keys(table)[0]].map((_, i) =>
    Object.keys(table).reduce((acc, key) => {
      acc[key] = table[key][i];
      return acc;
    }, {} as Record<string, any>)
  );

  console.log('Extracted Data:', rows);

  const parseMermaidToTree = (input: string): { tree: Record<string, Node>; edges: [string, string, string][] } => {
    const tree: Record<string, Node> = {};
    const edges: [string, string, string][] = []; // Stores [from, to, label]
    const lines = input.split('\n').map(line => line.trim()).filter(line => line);
    const stack: { node: Record<string, Node>; depth: number }[] = [];
    let current = tree;
    let currentDepth = 0;
  
    lines.forEach((line, index) => {
      const match = line.match(/^(\s*)/);
      const depth = match ? match[0].length : 0;
  
      if (line.startsWith('subgraph')) {
        const subgraphMatch = line.match(/subgraph\s+([\w\d_-]+)\s+\[(.*?)\]/);
        if (subgraphMatch) {
          const [, id, label] = subgraphMatch;
          current[id] = { row: index, value: label, next: {} };
  
          stack.push({ node: current, depth: currentDepth });
          current = current[id].next!;
          currentDepth = depth;
        }
      } else if (line.startsWith('end')) {
        while (stack.length > 0 && stack[stack.length - 1].depth >= currentDepth) {
          const prev = stack.pop();
          if (prev) {
            current = prev.node;
            currentDepth = prev.depth;
          }
        }
      } else if (line.includes('-->') || line.includes('---')) {
        
        const edgeMatch = line.match(/^([\w\d_-]+)\s*[-]+>\s*(\|([^|]+)\|)?\s*([\w\d_-]+)/);
        if (edgeMatch) {
          const [, from, , label = '', to] = edgeMatch;
          edges.push([from, to, label.trim()]);
        }
      } else {
        const nodeMatch = line.match(/^([\w\d_-]+)[(\[{](.*?)[)\]}]$/);
        if (nodeMatch) {
          const [, id, text] = nodeMatch;
          current[id] = { row: index, value: text, next: null };
        }
      }
    });
  
    return { tree, edges };
  };
  
  const evaluateCondition = (condition: string, row: Record<string, any>): boolean => {
    try {
      const keys = Object.keys(row);
      const values = Object.values(row);

      const func = new Function(...keys, `return ${condition};`);

      return func(...values);
    } catch (error) {
      return false;
    }
  };

  // const findPathUsingRule = (tree: Record<string, Node>, condition: ConditionElement, values: Record<string, any>): void => {
  //   Object.entries(tree).forEach(([nodeKey, node]) => {
  //     let splitKeys = nodeKey.split('_');
  //     let mainKey = splitKeys[0];  
  //     let secondKey = splitKeys[1]; 

  //     if (values[mainKey] && String(values[mainKey]) === String(secondKey)) {
  //       if (node.value && condition.action.bind.some(binding => node.value.includes(`$${binding.variable}`))) {
  //         condition.action.bind.forEach(binding => {
  //           const variable = binding.variable;
  //           if (node.value && node.value.includes(`$${variable}`)) {
  //             node.value = node.value.replace(new RegExp(`\\$${variable}`, 'g'), values[variable] || `$${variable}`);
  //             return
  //           }
  //         });
  //       }
  //     }
  //     if (node.next) {
  //       findPathUsingRule(node.next, condition, values);
  //     }
  //   });
  // };

  const findAndApplyBindings = (
    tree: Record<string, Node>,
    rule: YamlRule,
    rows: Record<string, any>[]
  ) => {
    for (const [key, node] of Object.entries(tree)) {
      if (key === rule.match.element || node.value === rule.match.element) {
        rows.forEach(row => {
          if(rule.match.if){
            if (evaluateCondition(rule.match.if.condition, row)) {
              console.log(`IF - Condition matched for node ${key}`, row);
              console.log(`CONDITION: ${rule.match.if.condition}`)
              rule.match.if.action.bind.forEach(binding => {
                if (node.value && node.value.includes(`$${binding.variable}`)) {
                  node.value = node.value.replace(
                    new RegExp(`\\$${binding.variable}`, 'g'),
                    row[binding.variable] || `$${binding.variable}`
                  );
                }
              });
              return
            }
          }
          if(rule.match.else_if){
            console.log(`ELSE_IF - Condition matched for node ${key}`, row);
            const elseIfArray = Array.isArray(rule.match.else_if) ? rule.match.else_if : [rule.match.else_if];
            let conditionMatched: boolean = false
            elseIfArray .forEach(else_if => {
              console.log(`CONDITION: ${else_if.condition}`)
              if((evaluateCondition(else_if.condition, row))){
                else_if.action.bind.forEach(binding=>{
                  if (node.value && node.value.includes(`$${binding.variable}`)) {
                    node.value = node.value.replace(
                      new RegExp(`\\$${binding.variable}`, 'g'),
                      row[binding.variable] || `$${binding.variable}`
                    );
                  } 
                })
                conditionMatched = true
                return
              }
            });
            if(conditionMatched){
              return
            }
          }
          if(rule.match.else){
            console.log(`ELSE - Condition matched for node ${key}`, row);
            console.log(`CONDITION: ${rule.match.else}`)
            rule.match.else.action.bind.forEach(binding => {
              if (node.value && node.value.includes(`$${binding.variable}`)) {
                node.value = node.value.replace(
                  new RegExp(`\\$${binding.variable}`, 'g'),
                  row[binding.variable] || `$${binding.variable}`
                );
              }
            });
          }
          
        });
      }
      if (node.next) {
        findAndApplyBindings(node.next, rule, rows);
      }
    }
  };
  
   
  let templateTree = parseMermaidToTree(template);
  console.log('Initial Parsed Tree:', templateTree);
  console.log(rules)
  rules.forEach(rule => {
    if(rule.match.if)
    {
      console.log(rule)
      findAndApplyBindings(templateTree.tree, rule, rows)
    }
  });

  // rules.forEach(rule => {
  //   rows.forEach(row => {
  //     if(rule.match.if){
  //       if (evaluateCondition(rule.match.if.condition, row)) {
  //         findPathUsingRule(templateTree.tree, rule.match.if, row);
  //         return
  //       }else if(rule.match.else_if){
  //         if (evaluateCondition(rule.match.else_if.condition, row)) {
  //           findPathUsingRule(templateTree.tree, rule.match.else_if, row);
  //           return
  //         }
  //       }else if(rule.match.else){
  //         if (evaluateCondition('true', row)) {
  //           findPathUsingRule(templateTree.tree, rule.match.else, row);
  //           return
  //         }
  //       }
  //     }
  //   });
  // });

  console.log('Updated Tree:', templateTree);

  const rebuildMermaid = (obj: Record<string, Node>, edges: [string, string, string][], depth = 0): string => {
    let output = '';
    const indent = '  '.repeat(depth);
    const nodeKeys = Object.keys(obj);

    nodeKeys.forEach((key) => {
        const node = obj[key];

        if (node.next) {
            output += `${indent}subgraph ${key} [${node.value}]\n`;
            output += rebuildMermaid(node.next, edges, depth + 1);
            output += `${indent}end\n`;
        } else {
            output += `${indent}${key}(${node.value})\n`;
        }
    });

    if (depth === 0) {
        edges.forEach(([from, to, label]) => {
            const edgeLabel = label ? `|${label}|` : '';
            output += `${from} -->${edgeLabel} ${to}\n`;
        });
    }

    return output;
};

  let generatedChart2 = `graph TB\n` + rebuildMermaid(templateTree.tree, templateTree.edges);
  console.log('Generated Mermaid Chart:', generatedChart2);

  useEffect(() => {
    if (chartRef.current) {
      mermaid.initialize({ startOnLoad: true });
  
      mermaid.render('graphDiv', generatedChart2).then(({ svg }) => {
        if (chartRef.current) {
          chartRef.current.innerHTML = svg;
  
          const svgElement = chartRef.current.querySelector('svg');
          if (svgElement) {
            createPanZoom(svgElement, {
              zoomDoubleClickSpeed: 1,
              maxZoom: 4,
              minZoom: 0.5,
            });
          }
        }
      });
    }
  }, [generatedChart2]);

  return <div ref={chartRef} />;
};
