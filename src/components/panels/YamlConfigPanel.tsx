import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import yaml from 'js-yaml';
import { PanelData, TypedVariableModel, VariableWithOptions } from '@grafana/data';
import { SimpleOptions } from 'types';
import createPanZoom from 'panzoom';
import { YamlBindRule, YamlStylingRule, ConditionElement, Action, FlowVertex, fullMermaidMap, BaseObject, FlowVertexTypeParam, FlowSubGraph, FunctionElement, FlowClass } from 'types/types';
import { generateDynamicMermaidFlowchart } from 'utils/MermaidUtils';
import { extractTableData, findAllElementsInMaps, findElementInMaps, reformatDataFromResponse, sortByPriority } from 'utils/TransformationUtils';
import { mapDataToRows } from 'utils/TransformationUtils';
import { bindData, bindDataToString } from 'utils/DataBindingUtils';
import { ElementConfigModal } from '../../modals/EditElementModal';
import { getLocationSrv, getTemplateSrv, locationService } from '@grafana/runtime';

interface OtherViewPanelProps {
  options: SimpleOptions;
  data: PanelData;
  onOptionsChange: (options: SimpleOptions) => void;
}

export const OtherViewPanel: React.FC<OtherViewPanelProps> = ({ options, data, onOptionsChange }) => {
  const { yamlConfig, template } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [grafanaVariables, setGrafanaVariables] = useState<TypedVariableModel[] | null>(null)
  const [variableChangeCount, setVariableChangeCount] = useState(0);
  const [selectedElement, setSelectedElement] = useState<BaseObject | null>(null);
  const [allElements, setAllElements] = useState<string[]>([])
  const chartRef = useRef<HTMLDivElement>(null);
  const fullMapRef = useRef<fullMermaidMap | null>(null);
  const validShapes = new Set<FlowVertexTypeParam>([
    'square',
    'doublecircle',
    'circle',
    'ellipse',
    'stadium',
    'subroutine',
    'rect',
    'cylinder',
    'round',
    'diamond',
    'hexagon',
    'odd',
    'trapezoid',
    'inv_trapezoid',
    'lean_right',
    'lean_left',
  ]);

  if (!yamlConfig || !template) {
    return <div>Please provide both YAML rules and a Mermaid template.</div>;
  }

  let parsedYaml: {bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[]};
  try {
    parsedYaml = yaml.load(yamlConfig);

    if (!Array.isArray(parsedYaml.bindingRules)) {
      parsedYaml.bindingRules = [];
    }
    if (!Array.isArray(parsedYaml.stylingRules)) {
      parsedYaml.stylingRules = [];
    }
  } catch (e) {
    if (e instanceof Error) {
      return <div>Error parsing YAML: {e.message}</div>;
    } else {
      return <div>An unknown error occurred</div>;
    }
  }

  const bindingRules: YamlBindRule[] = (parsedYaml.bindingRules || []).map(
    rule => new YamlBindRule(rule)
  );
  
  const stylingRules: YamlStylingRule[] = (parsedYaml.stylingRules || []).map(
    rule => new YamlStylingRule(rule)
  );

  const table = extractTableData(data)
  if (!table) return <div>No Data Available</div>;
  const rows = mapDataToRows(data)

  const getDiagram = async (template: string) : Promise<string> => {
    const res = await mermaid.mermaidAPI.getDiagramFromText(template)
    const fullMap = reformatDataFromResponse(res)
    const variables = getTemplateSrv().getVariables()
    fullMapRef.current = fullMap;
    setGrafanaVariables(variables)
    setAllElements(findAllElementsInMaps(fullMap))
    updateMapValuesWithDefault(fullMap)
    applyAllRules(bindingRules, stylingRules, fullMap, rows, variables)
    onOptionsChange({...options, diagramMap: fullMap, diagramElements: findAllElementsInMaps(fullMap)})
    return generateDynamicMermaidFlowchart(fullMap);
  };
  

  const applyAllRules = ((bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[], fullMap: fullMermaidMap, rows: Record<string, any>[], grafanaVariables: TypedVariableModel[] | null)=>{
    const sortedBindingRules = sortByPriority(bindingRules)
    const sortedStylingRules = sortByPriority(stylingRules)
    sortedBindingRules.forEach(rule => {
      if(rule.function){
        findAndApplyBindings(fullMap, rule, rows, grafanaVariables)
      }else if(rule.bindData){
        getElements(rule, fullMap).forEach(element=>{
          let mapElement = findElementInMaps(element, fullMap)
          if(mapElement){
            addActions({bindData: rule.bindData}, mapElement)
          }
        })
      }
    });
    bindData(fullMap)
    sortedStylingRules.forEach(rule => {
      if(rule.function){
        findAndApplyStyling(fullMap, rule, grafanaVariables)
      }
    });
  })

  const updateMapValuesWithDefault = (fullMap: fullMermaidMap) =>{
    fullMap.nodes.forEach((node)=>{
      node.data= {}
    })
    fullMap.subGraphs.forEach((subGraph)=>{
      subGraph.data={}
      subGraph.styles=[]
    })
  }

  const evaluateCondition = (condition: string, row: Record<string, any> | undefined, grafanaVariables: TypedVariableModel[] | null): boolean => {
    try {
      if (!row) {
        return false;
      }
      const rowKeys = Object.keys(row);
      const rowValues = Object.values(row);
      
      const variableMap: Record<string, any> = {};
      if (grafanaVariables) {
        grafanaVariables.forEach((variable) => {
          variableMap[variable.name] = (variable as VariableWithOptions).current.value;
        });
      }
      
      const allKeys = [...rowKeys, ...Object.keys(variableMap)];
      const allValues = [...rowValues, ...Object.values(variableMap)];

      const func = new Function(...allKeys, `return ${condition};`);
      return func(...allValues);
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  };

  const determineAction = (rule: YamlBindRule | YamlStylingRule, row: Record<string, any> | undefined, grafanaVariables: TypedVariableModel[] | null):  ConditionElement[] | null => {
    let matchedAction: ConditionElement[] = []
    let func = rule.function
    if(!func){
      return null
    }
    let valueFound = false
    if (func.if && evaluateCondition(func.if.condition, row, grafanaVariables)) {
      matchedAction.push(func.if); 
      valueFound = true
    } 
    else if (func.else_if) {
      const elseIfArray = Array.isArray(func.else_if) ? func.else_if : [func.else_if];
      for (const elseIf of elseIfArray) {
        if (evaluateCondition(elseIf.condition, row, grafanaVariables)) {
          matchedAction.push(elseIf);
          valueFound = true
          break
        }
      }
    } 
    if (func.else && !valueFound) {
      matchedAction.push({action: func.else.action, condition: 'true'});
    }

    return matchedAction.length > 0 ? matchedAction : null;
  };

  const findAndApplyBindings = (map: fullMermaidMap, rule: YamlBindRule, rows: Record<string, any>[],  grafanaVariables: TypedVariableModel[] | null) => {
    rows.some((row) => {
      const actionDataList = determineAction(rule, row, grafanaVariables);
      if (actionDataList) {
        let elementList: string[] = getElements(rule, map)
        elementList.forEach(element => {
          let elementInMap = findElementInMaps(element, map)
          if(elementInMap){
            actionDataList.forEach(action=>{
              if(action.action.bindData){
                addActions({bindData: action.action.bindData}, elementInMap, row, grafanaVariables)
              }
            })
          }
        });
      }
      return actionDataList!==null
    });
  };

  const bindDataAction = (
    Action: Action,
    Element: BaseObject,
    row?: any,
    grafanaVariables?: TypedVariableModel[] | null
  ) => {
    if (!Element.data) {
      Element.data = {};
    }
    
    if (row) {
      Element.data = {
        ...Element.data,
        ...row
      };
    }
    
    if (grafanaVariables && grafanaVariables.length > 0) {
      const variablesData: Record<string, any> = {};
      
      grafanaVariables.forEach(variable => {
        variablesData[variable.name] = (variable as VariableWithOptions).current.value;
      });
      
      Element.data = {
        ...Element.data,
        ...variablesData
      };
    }
    
    if (Action.bindData && Array.isArray(Action.bindData)) {
      Action.bindData.forEach((actionX) => {
        const [key, value] = actionX.split('=');
        Element.data = {
          ...Element.data,
          [key]: value
        };
      });
    }
  };

  const applyClassAction = (Action: Action, Element: BaseObject)=>{
    if(Action.applyClass){
      Action.applyClass.forEach((className: string) => {
        const classIndex = Element.classes.indexOf(className);
        if (classIndex !== -1) {
          Element.classes.splice(classIndex, 1);
        }
        Element.classes.push(className);
      });
    }
  }
  
  const applyStyleAction = (Action: Action, Element: BaseObject)=>{
    if(Action.applyStyle){
      Action.applyStyle.forEach((styleName: string) => {
        const [property] = styleName.split(':');
        const existingStyleIndex = Element.styles.findIndex(style => style.startsWith(property + ':'))
        if (existingStyleIndex !== -1) {
          Element.styles.splice(existingStyleIndex, 1, styleName);
        } else {
          Element.styles.push(styleName);
        }
      });
    }
  }

  const applyTextAction = (Action: Action, Element: BaseObject)=>{
    if(Action.applyText){
      const text = bindDataToString(Action.applyText, Element)
      if ('title' in Element) {
        Element.title = text
      } else if ('text' in Element) {
        Element.text = text
      }
    }
  }
  
  const isValidShape = (shape: any): shape is FlowVertexTypeParam => validShapes.has(shape);
  const applyShapeAction = (Action: Action, Element: BaseObject)=>{
    if(Action.applyShape){
      if (isValidShape(Action.applyShape)){
        (Element as FlowVertex).type = Action.applyShape
      }
    }
  }

  const  addActions = (
    Action: Action,
    Element: BaseObject,
    row?: any,
    grafanaVariables?: TypedVariableModel[] | null
  ) => {
    Object.keys(Action).forEach(action => {
      switch (action) {
        case "bindData":
          bindDataAction(Action, Element, row, grafanaVariables)
          break;
        case "applyClass":
          applyClassAction(Action, Element)
          break;
        case "applyStyle":
          applyStyleAction(Action, Element)
          break;
        case "applyText":
          applyTextAction(Action, Element)
          break;
        case "applyShape":
          applyShapeAction(Action, Element)
          break;
        case "applyLink":
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

  const findAndApplyStyling = (fullMap: fullMermaidMap, rule: YamlStylingRule, grafanaVariables: TypedVariableModel[] | null) =>{
    let elementList: string[] = getElements(rule, fullMap)
    elementList.forEach(object =>{
      let mapElement = findElementInMaps(object, fullMap)
      if(mapElement && mapElement.data &&  Object.keys(mapElement.data).length > 0){
        const actionDataList = determineAction(rule, mapElement.data, grafanaVariables);
        if(actionDataList){
          actionDataList.forEach(action=>{
            if(action.action.bindData){
              delete action.action.bindData
            }
            addActions(action.action, mapElement as FlowVertex, rule)
          })
        }
      }
    })
  }

  const handleElementDoubleClick = (event: MouseEvent) => {
    console.log(event.target);
    if (!fullMapRef.current) return;
    
    const currentElement = event.target as HTMLElement;
    
    const nodeElement = currentElement.closest('[id^="flowchart-"], .cluster') as HTMLElement | null;
    
    if (!nodeElement) {
      return;
    }
    
    let nodeId: string;
    
    if (nodeElement.classList.contains('cluster')) {
      const clusterId = nodeElement.id;
      if (clusterId) {
        nodeId = clusterId;
      } else {
        const labelElement = nodeElement.querySelector('.nodeLabel') as HTMLElement | null;
        if (labelElement) {
          nodeId = labelElement.textContent?.trim() || '';
        } else {
          return;
        }
      }
    } else {
      nodeId = nodeElement.id.replace('flowchart-', '').replace(/[-_]\d+$/, '');
    }
    
    console.log('Node/Subgraph identified:', nodeId);
    
    const element = findElementInMaps(nodeId, fullMapRef.current);
    
    if (element) {
      console.log('Element found:', element);
      setSelectedElement(element);
      setIsModalOpen(true);
    } else {
      console.warn('Could not find element with ID:', nodeId);
    }
  };

  const handleYamlConfigChange = (newYamlConfig: string) => {
    onOptionsChange({...options, yamlConfig: newYamlConfig})
  };

const debugNodeElementMapping = (svgElement: SVGElement) => {
  const nodeElements = svgElement.querySelectorAll('[id^="flowchart-"]');
  console.log('All flowchart elements:', nodeElements.length);
  nodeElements.forEach(node => {
    const nodeId = node.id.replace('flowchart-', '').replace(/[-_]\d+$/, '');
    console.log(`Node mapping: ${node.id} -> ${nodeId}`);
  });
};

useEffect(() => {
  // Listen to dashboard variable changes using locationService
  const subscription = locationService.getHistory().listen(() => {
    // This will trigger when URL changes, which happens on variable selection
    setVariableChangeCount((prev) => prev + 1);
  });
  
  return () => {
    // Clean up subscription when component unmounts
    subscription();
  };
}, []);

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
                
                debugNodeElementMapping(svgElement as SVGElement);
                
                svgElement.addEventListener('dblclick', handleElementDoubleClick);
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
    
  return () => {
    if (chartRef.current) {
      const svgElement = chartRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.removeEventListener('dblclick', handleElementDoubleClick);
      }
    }
  };
}, [template, yamlConfig, variableChangeCount]);

return (
  <div>
    {isLoading && <div className="loading-indicator">Loading diagram...</div>}
    <div ref={chartRef} className={isLoading ? "hidden" : ""} />
    
    <ElementConfigModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      element={selectedElement}
      elements={allElements}
      possibleClasses={fullMapRef.current?.classes as Map<string, FlowClass>}
      yamlConfig={parsedYaml}
      onYamlConfigChange={handleYamlConfigChange}
    />
  </div>
);
};