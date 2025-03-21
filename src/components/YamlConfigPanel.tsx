import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import yaml from 'js-yaml';
import { PanelData } from '@grafana/data';
import { SimpleOptions } from 'types';
import createPanZoom from 'panzoom';
import { YamlBindRule, YamlFunctions, YamlStylingRule, ConditionElement, Action, FlowVertex, fullMermaidMap, BaseObject } from 'types/types';
import { generateDynamicMermaidFlowchart } from 'utils/MermaidUtils';
import { extractTableData, findAllElementsInMaps, findElementInMaps, reformatDataFromResponse } from 'utils/TransformationUtils';
import { mapDataToRows } from 'utils/TransformationUtils';
import { bindData } from 'utils/DataBindingUtils';
interface OtherViewPanelProps {
  options: SimpleOptions;
  data: PanelData;
}

export const OtherViewPanel: React.FC<OtherViewPanelProps> = ({ options, data }) => {
  const { yamlConfig, template } = options;
  const [isLoading, setIsLoading] = useState(true)
  const chartRef = useRef<HTMLDivElement>(null);
  console.log(template)

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

  const table = extractTableData(data)
  if (!table) return <div>No Data Available</div>;
  const rows = mapDataToRows(data)
  console.log('Extracted rows Data:', rows);

  let fullMap: fullMermaidMap

  const getDiagram = async (template: string) : Promise<string> => {
    const res = await mermaid.mermaidAPI.getDiagramFromText(template)
    console.log(res)
    fullMap = reformatDataFromResponse(res)
    updateMapValuesWithDefault(fullMap)
    applyAllRules(bindingRules, fullMap, rows, functions)
    bindData(fullMap)
    bindClasses(fullMap)
    console.log(fullMap)
    console.log(generateDynamicMermaidFlowchart(fullMap))
    return generateDynamicMermaidFlowchart(fullMap);
  };

  const applyAllRules = ((bindingRules: YamlBindRule[], fullMap: fullMermaidMap, rows: Record<string, any>[], functions: YamlFunctions[])=>{
    bindingRules.forEach(rule => {
      if(rule.function){
        findAndApplyBindings(fullMap, rule, rows, functions)
      }else if(rule.bindData){
        getElements(rule, fullMap).forEach(element=>{
          let mapElement = findElementInMaps(element, fullMap)
          if(mapElement){
            addActions({bindData: rule.bindData}, mapElement, rule)
          }
        })
      }
    });
    stylingRules.forEach(rule => {
      if(rule.function){
        findAndApplyStyling(fullMap, rule)
      }
    });
  })

  const updateMapValuesWithDefault = (fullMap: fullMermaidMap) =>{
    fullMap.nodes.forEach((node)=>{
      node.bindingData={priority: -1, data: {}}
      node.stylingData=[]
    })
    fullMap.subGraphs.forEach((subGraph)=>{
      subGraph.bindingData={priority: -1, data: {}}
      subGraph.stylingData=[]
    })
  }

  const bindClasses = (fullMap: fullMermaidMap) => {
    const elementsFromMap = findAllElementsInMaps(fullMap);
    if(elementsFromMap){
      elementsFromMap.forEach((element)=>{
        let mapElement = findElementInMaps(element, fullMap)
        let elementData = mapElement?.stylingData??null
        if(elementData && mapElement && Object.keys(elementData).length > 0){
          elementData.sort((a,b) => a.priority - b.priority)
          elementData.forEach(data => {
              mapElement.classes.push(data.class)
          });
          mapElement.classes = [...new Set(mapElement?.classes)];
        }
      })
    };
  }

  const evaluateCondition = (condition: string, row: Record<string, any> | undefined): boolean => {
    try {
      if(row){
      const keys = Object.keys(row);
      const values = Object.values(row);
      const func = new Function(...keys, `return ${condition};`);

      return func(...values);
      }
      return false
    } catch (error) {
      return false;
    }
  };

  const determineAction = (rule: YamlBindRule | YamlStylingRule, row: Record<string, any> | undefined, functions: YamlFunctions[]):  ConditionElement[] | null => {
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

  const findAndApplyBindings = (map: fullMermaidMap, rule: YamlBindRule, rows: Record<string, any>[], functions: YamlFunctions[]) => {
    rows.some((row) => {
      const actionDataList = determineAction(rule, row, functions);
      if (actionDataList) {
        let elementList: string[] = getElements(rule, map)
        elementList.forEach(element => {
          let elementInMap = findElementInMaps(element, map)
          if(elementInMap){
            actionDataList.forEach(action=>{
              addActions(action.action, elementInMap, rule, row)
            })
          }
        });
      }
      return actionDataList!==null
    });
  };

  const bindDataAction = (Action: Action,
    Element: BaseObject,
    rule: YamlBindRule | YamlStylingRule,
    row?: any)=>{
    const tempPriority = rule.priority ? rule.priority : -1
    if (Element.bindingData.priority && Element.bindingData.priority <= tempPriority) {
      Element.bindingData.priority = tempPriority;
      if(row) {
        Object.keys(row).forEach((key) => {
          if(Element.bindingData.data) {
            Element.bindingData.data = row;
          }
        });
      } 
      Action.bindData?.forEach((actionX) => {
        const [key, value] = actionX.split('=');
        
        Element.bindingData.data = {
          ...Element.bindingData.data,
          [key]: value  
        };
      });
    }
  }

  const applyClassAction = (Action: Action, Element: BaseObject, rule: YamlBindRule | YamlStylingRule)=>{
    if(Action.applyClass){
      Action.applyClass.forEach((className: string) => {
        Element.stylingData.push({
          class: className,
          priority: rule.priority ? rule.priority : -1,
        });
      });
    }
  }
  
  const addActions = (
    Action: Action,
    Element: BaseObject,
    rule: YamlBindRule | YamlStylingRule,
    row?: any
  ) => {
    Object.keys(Action).forEach(action => {
      switch (action) {
        case "bindData":
          bindDataAction(Action, Element, rule, row)
          break;
        case "applyClass":
          applyClassAction(Action, Element, rule)
          break;
        default:
          console.warn(`Unknown action type: ${action}`);
      }
    });
  };

  const getElements = (rule: YamlBindRule | YamlStylingRule, map: fullMermaidMap):string[]=>{
    let elementList: string[] = []
    if(rule.elements){
      rule.elements.forEach(element=>{
        if (element === 'all' || element === 'nodes' || element === 'subgraphs'){
          const elementsFromMap = findAllElementsInMaps(map, element);
          elementList.push(...elementsFromMap);
        }
        elementList.push(element)
      })
    }else{
      const elementsFromMap = findAllElementsInMaps(map);
      elementList.push(...elementsFromMap);
    }
    elementList = [...new Set(elementList)];
    return elementList
  }

  const findAndApplyStyling = (fullMap: fullMermaidMap, rule: YamlStylingRule) =>{
    let elementList: string[] = getElements(rule, fullMap)
    elementList.forEach(object =>{
      let mapElement = findElementInMaps(object, fullMap)
      if(mapElement && mapElement.bindingData.data &&  Object.keys(mapElement.bindingData.data).length > 0){
        const actionDataList = determineAction(rule, mapElement.bindingData.data, functions);
        if(actionDataList){
          actionDataList.forEach(action=>{
            addActions(action.action, mapElement as FlowVertex, rule)
          })
        }
      }
    })
  }
  console.log(bindingRules)
  console.log(stylingRules)


  useEffect(() => {
    setIsLoading(true);
    
    mermaid.initialize({});
    getDiagram(template)
      .then((rez) => {
        if (chartRef.current) {
          mermaid.render('graphDiv', rez)
            .then(({ svg }) => {
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
                setIsLoading(false);
              }
            })
            .catch((error) => {
              console.error('Error rendering diagram:', error);
              setIsLoading(false);
            });
        }
      })
      .catch((error) => {
        console.error('Error fetching diagram data:', error);
        setIsLoading(false);
      });
  }, [template, getDiagram, createPanZoom]);

  return (
    <div>
      {isLoading && <div className="loading-indicator">Loading diagram...</div>}
      <div ref={chartRef} className={isLoading ? "hidden" : ""} />
    </div>
  );
};
