import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import yaml from 'js-yaml';
import { PanelData } from '@grafana/data';
import { SimpleOptions } from 'types';
import createPanZoom from 'panzoom';
import { YamlBindRule, YamlFunction, YamlStylingRule, ConditionElement, Action, FlowVertex, fullMermaidMap, BaseObject, FlowVertexTypeParam, FlowSubGraph, FunctionElement } from 'types/types';
import { generateDynamicMermaidFlowchart } from 'utils/MermaidUtils';
import { extractTableData, findAllElementsInMaps, findElementInMaps, reformatDataFromResponse, sortByPriority } from 'utils/TransformationUtils';
import { mapDataToRows } from 'utils/TransformationUtils';
import { bindData } from 'utils/DataBindingUtils';
import { ElementConfigModal } from '../modals/EditElementModal';

interface OtherViewPanelProps {
  options: SimpleOptions;
  data: PanelData;
  onOptionsChange: (options: SimpleOptions) => void;
}

export const OtherViewPanel: React.FC<OtherViewPanelProps> = ({ options, data, onOptionsChange }) => {
  const { yamlConfig, template } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  let parsedYaml: {bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[], functions: YamlFunction[]};
  try {
    parsedYaml = yaml.load(yamlConfig);
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
  const functions: YamlFunction[] = parsedYaml.functions || []

  const table = extractTableData(data)
  if (!table) return <div>No Data Available</div>;
  const rows = mapDataToRows(data)
  console.log('Extracted rows Data:', rows);

  const getDiagram = async (template: string) : Promise<string> => {
    const res = await mermaid.mermaidAPI.getDiagramFromText(template)
    const fullMap = reformatDataFromResponse(res)
    fullMapRef.current = fullMap;
    setAllElements(findAllElementsInMaps(fullMap))
    updateMapValuesWithDefault(fullMap)
    applyAllRules(bindingRules, stylingRules, fullMap, rows, functions)
    console.log(fullMap)
    console.log(generateDynamicMermaidFlowchart(fullMap))
    return generateDynamicMermaidFlowchart(fullMap);
  };

  const applyAllRules = ((bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[], fullMap: fullMermaidMap, rows: Record<string, any>[], functions: YamlFunction[])=>{
    const sortedBindingRules = sortByPriority(bindingRules)
    const sortedStylingRules = sortByPriority(stylingRules)

    sortedBindingRules.forEach(rule => {
      if(rule.function){
        findAndApplyBindings(fullMap, rule, rows, functions)
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
        findAndApplyStyling(fullMap, rule)
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

  const determineAction = (rule: YamlBindRule | YamlStylingRule, row: Record<string, any> | undefined, functions: YamlFunction[]):  ConditionElement[] | null => {
    let matchedAction: ConditionElement[] = []
    let func = rule.function
    if(!func){
      return null
    }
   
    if (typeof func === 'string') {
      const foundFunction = functions.find((functionn) => functionn.id === func)?.function;
      if (!foundFunction) {
        return null
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
      matchedAction.push({action: func.else.action, condition: 'true'});
    }

    return matchedAction.length > 0 ? matchedAction : null;
  };

  const findAndApplyBindings = (map: fullMermaidMap, rule: YamlBindRule, rows: Record<string, any>[], functions: YamlFunction[]) => {
    rows.some((row) => {
      const actionDataList = determineAction(rule, row, functions);
      if (actionDataList) {
        let elementList: string[] = getElements(rule, map)
        elementList.forEach(element => {
          let elementInMap = findElementInMaps(element, map)
          if(elementInMap){
            actionDataList.forEach(action=>{
              if(action.action.bindData){
                addActions({bindData: action.action.bindData}, elementInMap, row)
              }
            })
          }
        });
      }
      return actionDataList!==null
    });
  };

  const bindDataAction = (Action: Action,
    Element: BaseObject,
    row?: any)=>{
    if(row) {
      Object.keys(row).forEach((key) => {
        if(Element.data) {
          Element.data = row;
        }
      });
    } 
    Action.bindData?.forEach((actionX) => {
      const [key, value] = actionX.split('=');
      Element.data = {
        ...Element.data,
        [key]: value  
      };
    });
  }

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
      if ('title' in Element) {
        Element.title = Action.applyText
      } else if ('text' in Element) {
        Element.text = Action.applyText
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

  const addActions = (
    Action: Action,
    Element: BaseObject,
    row?: any
  ) => {
    Object.keys(Action).forEach(action => {
      switch (action) {
        case "bindData":
          bindDataAction(Action, Element, row)
          break;
        case "applyClass":
          applyClassAction(Action, Element)
          break;
        case "applyStyle":
          applyStyleAction(Action, Element)
          break;
        case "applyText":
          applyTextAction(Action, Element )
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

  const findAndApplyStyling = (fullMap: fullMermaidMap, rule: YamlStylingRule) =>{
    let elementList: string[] = getElements(rule, fullMap)
    elementList.forEach(object =>{
      let mapElement = findElementInMaps(object, fullMap)
      if(mapElement && mapElement.data &&  Object.keys(mapElement.data).length > 0){
        const actionDataList = determineAction(rule, mapElement.data, functions);
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
    
    // Check for flowchart nodes or clusters (subgraphs)
    const nodeElement = currentElement.closest('[id^="flowchart-"], .cluster') as HTMLElement | null;
    
    if (!nodeElement) {
      // If no direct node or cluster found, do nothing
      return;
    }
    
    let nodeId: string;
    
    if (nodeElement.classList.contains('cluster')) {
      // For clusters, use the cluster's ID directly
      const clusterId = nodeElement.id;
      if (clusterId) {
        nodeId = clusterId;
      } else {
        // Fallback: Look for a label within the cluster
        const labelElement = nodeElement.querySelector('.nodeLabel') as HTMLElement | null;
        if (labelElement) {
          // Use the text content of the label
          nodeId = labelElement.textContent?.trim() || '';
        } else {
          return;
        }
      }
    } else {
      // For direct flowchart nodes
      nodeId = nodeElement.id.replace('flowchart-', '').replace(/[-_]\d+$/, '');
    }
    
    console.log('Node/Subgraph identified:', nodeId);
    
    // Find the element in either nodes or subgraphs
    const element = findElementInMaps(nodeId, fullMapRef.current);
    
    if (element) {
      console.log('Element found:', element);
      setSelectedElement(element);
      setIsModalOpen(true);
    } else {
      console.warn('Could not find element with ID:', nodeId);
    }
  };

// Handle YAML config changes from the modal
const handleYamlConfigChange = (newYamlConfig: string) => {
  onOptionsChange({
    ...options,
    yamlConfig: newYamlConfig
  });
};

// Add a debug function to log node-element relationships when diagram renders
const debugNodeElementMapping = (svgElement: SVGElement) => {
  const nodeElements = svgElement.querySelectorAll('[id^="flowchart-"]');
  console.log('All flowchart elements:', nodeElements.length);
  nodeElements.forEach(node => {
    const nodeId = node.id.replace('flowchart-', '').replace(/[-_]\d+$/, '');
    console.log(`Node mapping: ${node.id} -> ${nodeId}`);
  });
};

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
                // Initialize pan-zoom
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
}, [template, yamlConfig]);

return (
  <div>
    {isLoading && <div className="loading-indicator">Loading diagram...</div>}
    <div ref={chartRef} className={isLoading ? "hidden" : ""} />
    
    {/* Configuration Modal */}
    <ElementConfigModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      element={selectedElement}
      elements={allElements}
      yamlConfig={parsedYaml}
      onYamlConfigChange={handleYamlConfigChange}
    />
  </div>
);
};