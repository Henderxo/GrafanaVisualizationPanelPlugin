import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import yaml from 'js-yaml';
import { PanelData } from '@grafana/data';
import { SimpleOptions } from 'types';
import createPanZoom from 'panzoom';
import { isString } from 'mermaid/dist/utils';

interface OtherViewPanelProps {
  options: SimpleOptions;
  data: PanelData;
}

interface YamlRule {
  id: string;
  match: MatchElement;
}

interface YamlFunctions{
  id: string;
  function: FunctionElement
}

interface MatchElement {
  element: string
  function: string | FunctionElement
}

interface FunctionElement {
  if?: ConditionElement
  else_if?: ConditionElement[]
  else?: ConditionElement
}

interface ConditionElement {
  condition: string
  action: ActionElement
}

interface ActionElement{
  bindData: string[];
  bindClass: string[];
}

interface Node {
  row?: number;
  value?: string;
  type: string;
  endRow?: number;
}

interface TemplateObject {
  [key: string]: Node | Record<string, any>;
}

interface ClassStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  [key: string]: string | undefined;
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
  const functions: YamlFunctions[] = parsedYaml.functions || []
  const classBindings = new Map<string, string[]>();

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

  const parseStyleString = (style: string): ClassStyle => {
    const styleObj: ClassStyle = {};
    
    const regex = /([a-zA-Z-]+)\s*[:=]\s*([^,;]+)/g;
    let match;
    
    while ((match = regex.exec(style)) !== null) {
      const [, property, value] = match;
      styleObj[property] = value;
    }
  
    return styleObj;
  };

  const parseMermaidToMap = (input: string): { object: TemplateObject; edges: [string, string, string, string][]; classDefs: Map<string, ClassStyle>, config: Partial<FlowchartConfig> } => {
    const object: TemplateObject = { };
    const edges: [string, string, string, string][] = []; 
    const classDefs: Map<string, ClassStyle> = new Map(); 
    let config: string = "";
    const lines = input.split('\n').map(line => line.trim()).filter(line => line);
    const subgraphStack: string[] = [];
  
    const configMatch = input.match(/%%\{init:\s*([\s\S]*?)\}%%/);
    if (configMatch) {
      config = configMatch[0]; 
    }

    lines.forEach((line, index) => {
      if (line.startsWith('subgraph')) {
        const subgraphMatch = line.match(/subgraph\s+([\w\d_-]+)\s+\[(.*?)\]/);
        if (subgraphMatch) {
          const [, id, label] = subgraphMatch;
          object[id] = { row: index, value: label, type: 'subgraph' };
          subgraphStack.push(id);
        }
      } else if (line.startsWith('end')) {
        if (subgraphStack.length > 0) {
          const lastSubgraph = subgraphStack.pop();
          if (lastSubgraph) {
            object[lastSubgraph].endRow = index;
          }
        }
      } else if (line.includes('-->') || line.includes('---') || line.includes('-.->')) {
        const edgeMatch = line.match(/^([\w\d_-]+)\s*([-]+>|\-\.\-\>|\-\-\>|\-\-)\s*(\|([^|]+)\|)?\s*([\w\d_-]+)/);
        
        if (edgeMatch) {
          const [, from, arrowType, , label = '', to] = edgeMatch;
          // Push the edge with the arrow type included
          edges.push([from, to, label.trim(), arrowType.trim()]);
        }
      } else if (line.startsWith('classDef')) {
        const classDefMatch = line.match(/^classDef\s+([\w\d_-]+)\s+(.*)$/);
        if (classDefMatch) {
          const [, className, classStyle] = classDefMatch;
          
          const style = parseStyleString(classStyle);
          classDefs.set(className, style);
        }
      } else {
        const nodeMatch = line.match(/^([\w\d_-]+)[(\[{](.*?)[)\]}]$/);
        if (nodeMatch) {
          const [, id, text] = nodeMatch;
          if (subgraphStack.length > 0) {

            object[id] = { row: index, value: text, type: 'node' };
          } else {
            object[id] = { row: index, value: text, type: 'node' };
          }
        }
      }
    });
  
    return { object, edges, classDefs, config };
};

  console.log(parseMermaidToMap(template).object)
  console.log(parseMermaidToMap(template).config)

  const bindData = (object: TemplateObject, element: string, row: Record<string, any>, dataBinding: string[]) => {
    if (object[element]) {
      const node = object[element];

      const bindingMap: Record<string, any> = Object.fromEntries(
          dataBinding
              .filter(binding => binding.includes("=")) 
              .map(binding => binding.split("=").map(part => part.replace(/['"]/g, '').trim())) 
      );

      const isDefaultBinding = dataBinding.includes("default");

      if (node.value) {
          node.value = node.value.replace(/\$(\w+)/g, (match: any, variable: any) => {
              if (isDefaultBinding) {
                  return row[variable] !== undefined ? row[variable] : match; 
              } else if(bindingMap) {
                  return (bindingMap[variable] !== undefined ? bindingMap[variable] : row[variable] !== undefined ? row[variable] : match); // Else use explicit binding
              } else {
                return row[variable] !== undefined ? row[variable] : match;
              }
          });
      }
  }
  };




  

  const bindClasses = (element: string, classNames: string[], classBindings: Map<string, string[]>) => {

    classNames.forEach(className => {
      if (!classBindings.has(className)) {
        classBindings.set(className, []);
      }
  
      const elements = classBindings.get(className);
      if (elements && !elements.includes(element)) {
        elements.push(element);
      }
    });
  };
  

  const executeAction = (templateMap: TemplateObject, actionElement: ActionElement, element: string, row: Record<string, any>, rule: YamlRule) => {
    Object.keys(actionElement).forEach(action => {
      switch (action) {
        case "bindData":
          console.log('bindingdata')
          bindData(templateMap, element, row, actionElement[action]);
          break;
        case "bindClass":
          bindClasses(element, actionElement[action], classBindings)
          break;
        default:
          console.warn(`Unknown action type: ${action}`);
      }
    }); 
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

  const determineAction = (rule: YamlRule, row: Record<string, any>, functions: YamlFunctions[]): { action: ActionElement; data: any } | null => {
    let matchedAction: ConditionElement | null = null;

    let newFunction: FunctionElement | undefined = typeof rule.match.function === 'string'?functions.find((func) => func.id === rule.match.function)?.function:rule.match.function
    if(!newFunction){
      return null
    }
    if (newFunction.if && evaluateCondition(newFunction.if.condition, row)) {
      console.log(`IF - Matched for ${rule.match.element}`, row);
      matchedAction = newFunction.if;
    } else if (newFunction.else_if) {
      const elseIfArray = Array.isArray(newFunction.else_if) ? newFunction.else_if : [newFunction.else_if];
      for (const elseIf of elseIfArray) {
        if (evaluateCondition(elseIf.condition, row)) {
          console.log(`ELSE_IF - Matched for ${rule.match.element}`, row);
          matchedAction = elseIf;
          break;
        }
      }
    } else if (newFunction.else) {
      console.log(`ELSE - Matched for ${rule.match.element}`, row);
      matchedAction = newFunction.else;
    }
  
    return matchedAction ? { action: matchedAction.action, data: row } : null;
  };

  const findAndApplyBindings = (templateMap: TemplateObject, rule: YamlRule, rows: Record<string, any>[], functions: YamlFunctions[]) => {
    rows.some((row) => {
      const actionData = determineAction(rule, row, functions);
      if (actionData) {
        executeAction(templateMap, actionData.action, rule.match.element, actionData.data, rule);
      }
      return actionData!==null
    });
  };

 
  let templateMap = parseMermaidToMap(template)
  console.log('Initial Parsed Tree:', templateMap);
  console.log(rules)
  rules.forEach(rule => {
    if(rule.match.function)
    {
      console.log(rule)
      findAndApplyBindings(templateMap.object, rule, rows, functions)
    }
  });

  
  console.log('Updated map:', templateMap)

  const rebuildMermaid = (object: TemplateObject, edges: [string, string, string, string][], classBindings: Map<string, string[]>, classDefs: Map<string, ClassStyle>, config: string): string => {
    let output = `${config} \n`;
    output += `graph TB\n`;
    const addedNodes: Set<string> = new Set();
    const classGrouping: Map<string, string[]> = new Map(); 

    Object.keys(object).forEach((key) => {
        const node = object[key];

        if (node.type === 'subgraph') {
            output += `  subgraph ${key} [${node.value}]\n`;

            Object.keys(object).forEach((subKey) => {
                const subNode = object[subKey];
                if (subNode.row > node.row && subNode.row <= (node.endRow || Number.MAX_VALUE)) {
                    if (!addedNodes.has(subKey)) {
                        output += `    ${subKey}(${subNode.value})\n`;
                        addedNodes.add(subKey); 
                    }
                }
            });

            output += '  end\n'; 
        }
    });

    Object.keys(object).forEach((key) => {
        const node = object[key];
        if (node.type === 'node' && !node.endRow && !addedNodes.has(key)) {
            output += `${key}(${node.value})\n`;
            addedNodes.add(key); 
        }
    });

    edges.forEach(([from, to, label, arrowType]) => {
        const edgeLabel = label ? `|${label}|` : '';
        output += `${from} ${arrowType}${edgeLabel} ${to}\n`;
    });

    classBindings.forEach((elements, className) => {
        if (elements.length > 0) {
            if (!classGrouping.has(className)) {
                classGrouping.set(className, []);
            }
            classGrouping.get(className)?.push(...elements);
        }
    });

    classGrouping.forEach((elements, className) => {
        output += `class ${elements.join(',')} ${className};\n`;
    });

    classDefs.forEach((style, className) => {
        let styleStr = '';
        for (const [key, value] of Object.entries(style)) {
            styleStr += `${key}:${value},`;
        }
        styleStr = styleStr.slice(0, -1) + ';';
        output += `classDef ${className} ${styleStr}\n`;
    });

    return output;
};

  console.log('class bindings', classBindings)

  let generatedChart2 = rebuildMermaid(templateMap.object, templateMap.edges, classBindings, templateMap.classDefs, templateMap.config);
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
