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

interface YamlBindRule {
  id: string;
  scope: string
  type: string
  elements: string[]
  priority: number
  function: (string | FunctionElement)[]
}

interface YamlStylingRule{
  id: string
  scope: string
  type: string
  proprity: number
  function: FunctionElement[]
}

interface YamlFunctions{
  id: string;
  function: FunctionElement
}

interface FunctionElement {
  if?: ConditionElement
  else_if?: ConditionElement[]
  else?: ConditionElement
}

interface ConditionElement {
  condition: string
  action: Action
}

interface StylingElement{
  applyClass: string[];
  applyText: string[];
}

interface Action{
  bindData: string[];
  applyClass: string[];
  applyText: string[];
}

interface Node {
  row?: number;
  value?: string;
  type: string;
  endRow?: number;
  bindData: string[]
  bindClasses: string[]
  data: Record<string, any>
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

  const bindingRules: YamlBindRule[] = parsedYaml.bindingRules || [];
  const stylingRules: YamlStylingRule[] = parsedYaml.stylingRules || [];
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

  const parseMermaidToMap = (input: string): { object: TemplateObject; edges: [string, string, string, string][]; classDefs: Map<string, ClassStyle>, config: string } => {
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
          object[id] = { row: index, value: label, type: 'subgraph', bindClasses: [] };
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
            object[id] = { row: index, value: text, type: 'node', bindClasses: [] };
          } else {
            object[id] = { row: index, value: text, type: 'node', bindClasses: [] };
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
    console.log(classNames)
    classNames.forEach(className => {
      console.log(className)
      if (!classBindings.has(className)) {
        classBindings.set(className, []);
      }
      console.log(classBindings)
      const elements = classBindings.get(className);
      if (elements && !elements.includes(element)) {
        elements.push(element);
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

  const determineAction = (rule: YamlBindRule | YamlStylingRule, row: Record<string, any>, functions: YamlFunctions[]):  ConditionElement[] | null => {
    let matchedAction: ConditionElement[] = []

    for (let func of rule.function) {
      if (typeof func === 'string') {
        const foundFunction = functions.find((functionn) => functionn.id === func)?.function;
        if (!foundFunction) {
          continue;
        }
        func = foundFunction; 
      }
      let valueFound = false
      if (func.if && evaluateCondition(func.if.condition, row)) {
        matchedAction.push(func.if); 
        valueFound = true
      } 
      else if (func.else_if) {
        const elseIfArray = Array.isArray(func.else_if) ? func.else_if : [func.else_if];
        for (const elseIf of elseIfArray) {
          if (evaluateCondition(elseIf.condition, row)) {
            matchedAction.push(elseIf);
            valueFound = true
            break
          }
        }
      } 
      if (func.else && !valueFound) {
        matchedAction.push(func.else);
      }
    }
    return matchedAction.length > 0 ? matchedAction : null;
  };

  const findAndApplyBindings = (templateMap: TemplateObject, rule: YamlBindRule, rows: Record<string, any>[], functions: YamlFunctions[]) => {
    rows.some((row) => {
      const actionDataList = determineAction(rule, row, functions);
      if (actionDataList) {
        let elementList: string[] = []
        let specialElements = ''
        if(rule.elements.some(element =>{
          switch (element){
            case 'all':
              specialElements = 'all'
              break
            case 'nodes':
              specialElements = 'node'
              break
            case 'subgraphs':
              specialElements = 'subgraph'
              break
            default:
              break
          }
          return specialElements !== ''
          }))
        {
          Object.keys(templateMap).forEach(objectName =>{
            if(specialElements === 'all' || templateMap[objectName].type == specialElements){
              elementList.push(objectName)
            }
          })
        }else{
          elementList = rule.elements
        }
        elementList.forEach(element => {
          actionDataList.forEach(actionData=>{
            Object.keys(actionData.action).forEach(action =>{
              switch (action) {
                case "bindData":
                  templateMap[element].bindData = actionData.action[action]
                  break;
                case "applyClass":
                  actionData.action[action].forEach(className =>{
                    templateMap[element].bindClasses.push(className)
                  })
                  break;
                default:
                  console.warn(`Unknown action type: ${action}`);
              }
            })
          })
          templateMap[element].data = row
        });
      }
      return actionDataList!==null
    });
  };

  const findAndApplyStyling = (templateMap: TemplateObject, rule: YamlStylingRule, rows: Record<string, any>[]) =>{
    Object.keys(templateMap).forEach(object =>{
      if(templateMap[object].data){
        const actionDataList = determineAction(rule, templateMap[object].data, functions);
        if (actionDataList) {
          actionDataList.forEach(actionData=>{
            Object.keys(actionData.action).forEach(action =>{
              switch (action) {
                case "bindData":
                  templateMap[object].bindData = actionData.action[action]
                  break;
                  case "applyClass":
                    actionData.action[action].forEach(className =>{
                      templateMap[object].bindClasses.push(className)
                    })
                    break;
                default:
                  console.warn(`Unknown action type: ${action}`);
              }
            })
          })
        }
      }
    })
  }

 
  let templateMap = parseMermaidToMap(template)
  console.log('Initial Parsed Tree:', templateMap);
  console.log(bindingRules)
  console.log(stylingRules)
  bindingRules.forEach(rule => {
    if(rule.function){
      console.log(rule)
      findAndApplyBindings(templateMap.object, rule, rows, functions)
    }
  });
  stylingRules.forEach(rule => {
    if(rule.function){
      console.log(rule)
      findAndApplyStyling(templateMap.object, rule, functions)
    }
  });
  Object.keys(templateMap.object).forEach(ObjectName => {
    if(templateMap.object[ObjectName].bindData){
      bindData(templateMap.object, ObjectName, templateMap.object[ObjectName].data, templateMap.object[ObjectName].bindData);
    }
    if(templateMap.object[ObjectName].bindClasses){
      bindClasses(ObjectName, templateMap.object[ObjectName].bindClasses, classBindings)
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

    console.log(classBindings)

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
