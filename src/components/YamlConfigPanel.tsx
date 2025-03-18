import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import yaml from 'js-yaml';
import { PanelData } from '@grafana/data';
import { SimpleOptions } from 'types';
import createPanZoom from 'panzoom';
import { ClassStyle, StylingData, YamlBindRule, YamlFunctions, YamlStylingRule, ConditionElement, TemplateObject, BindingData, Element, Action } from 'types/types';
import { parseMermaidToMap } from 'utils/MermaidUtils';
import { extractTableData } from 'utils/TransformationUtils';
import { mapDataToRows } from 'utils/TransformationUtils';
import { bindData } from 'utils/DataBindingUtils';
import { Console } from 'console';
import { ElementSelectionContext } from '@grafana/ui';

interface OtherViewPanelProps {
  options: SimpleOptions;
  data: PanelData;
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
  const table = extractTableData(data)
  if (!table) return <div>No Data Available</div>;
  const rows = mapDataToRows(data)
  console.log('Extracted rows Data:', rows);
  let templateMap = parseMermaidToMap(template)
  console.log('Initial Parsed Tree:', templateMap);

  const bindClasses = (element: string, classData: StylingData[], classBindings: Map<string, string[]>) => {
    classData.sort((a,b) => a.priority - b.priority)
    classData.forEach(data => {
        if (!classBindings.has(element)) {
            classBindings.set(element, []);
        }
        const currentClasses = classBindings.get(element);

        if (currentClasses) {
          const classIndex = currentClasses.indexOf(data.class);
          if (classIndex !== -1) {
              currentClasses.splice(classIndex, 1); 
          }
            currentClasses.push(data.class);
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
        let elementList: string[] = getElements(rule, templateMap)
        elementList.forEach(element => {
          actionDataList.forEach(action=>{
            addActions(action.action, templateMap[element], rule, row)
          })
        });
      }
      return actionDataList!==null
    });
  };

  const addActions = (
    Action: Action,
    Element: Record<string, any> | Element,
    rule: YamlBindRule | YamlStylingRule,
    row?: any
  ) => {
      Object.keys(Action).forEach(action => {
        switch (action) {
          case "bindData":
            const tempPriority = rule.priority ? rule.priority : -1
            if (Element.bindingData && Element.bindingData.priority <= tempPriority) {
              Element.bindingData.priority = tempPriority;
              if (row) {
                Object.keys(row).forEach((key) => {
                  if (key in Element.bindingData.data) {
                    Element.bindingData.data[key] = row[key];
                  } else {
                    Element.bindingData.data[key] = row[key];
                  }
                });
              } 
              Action[action]?.forEach((actionX) => {
                const [key, value] = actionX.split('=');
                
                Element.bindingData.data = {
                  ...Element.bindingData.data,
                  [key]: value  
                };
              });
            }
            break;
  
          case "applyClass":
            if(Action[action]){
              Action[action].forEach((className: string) => {
                Element.stylingData.push({
                  class: className,
                  priority: rule.priority ? rule.priority : -1,
                });
              });
            }
            break;
  
          default:
            console.warn(`Unknown action type: ${action}`);
        }
      });
  };

  const getElements = (rule: YamlBindRule | YamlStylingRule, templateMap: TemplateObject):string[]=>{
    let elementList: string[] = []
    let specialElements = ''
    if(rule.elements){
      if(rule.elements.some(element =>{
        switch (element){
          case 'all':
            specialElements = 'all'
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
        })){
        Object.keys(templateMap).forEach(objectName =>{
          if(specialElements === 'all' || templateMap[objectName].type == specialElements){
            elementList.push(objectName)
          }
        })
      }else{
        elementList = rule.elements
      }
    }else{
      elementList = Object.keys(templateMap)
    }
    return elementList
  }

  const findAndApplyStyling = (templateMap: TemplateObject, rule: YamlStylingRule, rows: Record<string, any>[]) =>{
    let elementList: string[] = getElements(rule, templateMap)
    elementList.forEach(object =>{
      if(templateMap[object].bindingData.data){
        const actionDataList = determineAction(rule, templateMap[object].bindingData.data, functions);
        if(actionDataList){
          actionDataList.forEach(action=>{
            addActions(action.action, templateMap[object], rule)
          })
        }
      }
    })
  }

  console.log(bindingRules)
  console.log(stylingRules)
  bindingRules.forEach(rule => {
    if(rule.function){
      findAndApplyBindings(templateMap.object, rule, rows, functions)
    }else if(rule.bindData){
      getElements(rule, templateMap.object).forEach(element=>{
        addActions({bindData: rule.bindData},templateMap.object[element],rule)
      })
    }
  });
  stylingRules.forEach(rule => {
    if(rule.function){
      findAndApplyStyling(templateMap.object, rule, functions)
    }
  });
  Object.keys(templateMap.object).forEach(ObjectName => {
    if(templateMap.object[ObjectName].bindingData.data){
      bindData(templateMap.object, ObjectName, templateMap.object[ObjectName].bindingData.data);
    }
    if(templateMap.object[ObjectName].stylingData){
      bindClasses(ObjectName, templateMap.object[ObjectName].stylingData, classBindings)
    }
  });


  const rebuildMermaid = (object: TemplateObject, edges: [string, string, string, string][], classBindings: Map<string, string[]>, classDefs: Map<string, ClassStyle>, config: string): string => {
    let output = `${config} \n`;
    output += `graph TB\n`;
    const addedNodes: Set<string> = new Set();

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

    classBindings.forEach((classNames, element) => {
      classNames.forEach(name=>{
        output+= `class ${element} ${name};\n`
      })
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
