import React, { useEffect, useRef, useState, useMemo } from 'react';
import mermaid from 'mermaid';
import yaml from 'js-yaml';
import { PanelData, TypedVariableModel, VariableWithOptions } from '@grafana/data';
import { SimpleOptions } from 'types';
import createPanZoom from 'panzoom';
import { YamlBindRule, YamlStylingRule, ConditionElement, Action, FlowVertex, fullMermaidMap, BaseObject, FlowVertexTypeParam, FlowSubGraph, FunctionElement, FlowClass } from 'types/types';
import { generateDynamicMermaidFlowchart } from 'utils/MermaidUtils';
import { extractMermaidConfigString, extractTableData, findAllElementsInMaps, findElementInMaps, reformatDataFromResponse, sortByPriority } from 'utils/TransformationUtils';
import { mapDataToRows } from 'utils/TransformationUtils';
import { bindData, bindDataToString } from 'utils/DataBindingUtils';
import { ElementConfigModal } from '../../modals/EditElementModal';
import { getTemplateSrv, locationService } from '@grafana/runtime';
import { NoTemplatesProvidedDisplay } from 'displays/NoTemplatesProvidedDisplay';
import { ErrorService, ErrorType } from 'services/ErrorService';

interface OtherViewPanelProps {
  options: SimpleOptions;
  data: PanelData;
  onOptionsChange: (options: SimpleOptions) => void;
}

export const OtherViewPanel: React.FC<OtherViewPanelProps> = ({ options, data, onOptionsChange }) => {
  const { yamlConfig, template } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [variableChangeCount, setVariableChangeCount] = useState(0);
  const [selectedElement, setSelectedElement] = useState<BaseObject | null>(null);
  const [allElements, setAllElements] = useState<string[]>([]);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [parsedYamlState, setParsedYamlState] = useState<{
    bindingRules: YamlBindRule[], 
    stylingRules: YamlStylingRule[],
    parseError: string | null
  }>({
    bindingRules: [],
    stylingRules: [],
    parseError: null
  });
  const grafanaVariablesRef = useRef<TypedVariableModel[]>([])
  const chartRef = useRef<HTMLDivElement>(null);
  const fullMapRef = useRef<fullMermaidMap | null>(null);
  
  const validShapes = useMemo(() => new Set<FlowVertexTypeParam>([
    'square', 'doublecircle', 'circle', 'ellipse', 'stadium', 'subroutine', 
    'rect', 'cylinder', 'round', 'diamond', 'hexagon', 'odd', 
    'trapezoid', 'inv_trapezoid', 'lean_right', 'lean_left',
  ]), []);

  useEffect(() => {
    if (!yamlConfig) {
      setParsedYamlState({
        bindingRules: [],
        stylingRules: [],
        parseError: null
      });
      return;
    }

    try {
      const parsed = yaml.load(yamlConfig);
      
      setParsedYamlState({
        bindingRules: Array.isArray(parsed.bindingRules) 
          ? parsed.bindingRules.map((rule:any) => new YamlBindRule(rule)) 
          : [],
        stylingRules: Array.isArray(parsed.stylingRules) 
          ? parsed.stylingRules.map((rule:any) => new YamlStylingRule(rule)) 
          : [],
        parseError: null
      });
    } catch (e) {
      let errorMessage = 'An unknown error occurred';
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      setParsedYamlState({
        bindingRules: [],
        stylingRules: [],
        parseError: errorMessage
      });
      ErrorService.displayError(ErrorType.YAML_PARSING, {
        title: 'YAML Parsing Error',
        message: 'Failed to parse YAML configuration',
        error: e as Error
      });
    }
  }, [yamlConfig]);

  useEffect(() => {
    grafanaVariablesRef.current = getTemplateSrv().getVariables()
    const subscription = locationService.getHistory().listen(() => {
      const isVariableChange = getTemplateSrv().getVariables()
      if(JSON.stringify(grafanaVariablesRef.current) !== JSON.stringify(isVariableChange)){
        setVariableChangeCount(prev => prev + 1);
      }
      grafanaVariablesRef.current = isVariableChange;
    });
    
    return () => {
      subscription();
    };
  }, []);

  const getDiagram = async (templateStr: string): Promise<string> => {
    try {
      const res = await mermaid.mermaidAPI.getDiagramFromText(templateStr);
      const config = extractMermaidConfigString(templateStr)
      const fullMap = reformatDataFromResponse(res);
      const variables = getTemplateSrv().getVariables();
      fullMapRef.current = fullMap;
      setAllElements(findAllElementsInMaps(fullMap));
      updateMapValuesWithDefault(fullMap);
      
      const rows = extractTableData(data) ? mapDataToRows(data) : undefined;
      
      if (rows) {
        applyAllRules(
          parsedYamlState.bindingRules, 
          parsedYamlState.stylingRules, 
          fullMap, 
          rows, 
          variables
        );
      }
      
      onOptionsChange({
        ...options, 
        diagramMap: fullMap, 
        diagramElements: findAllElementsInMaps(fullMap)
      });
      
      setDiagramError(null);
      return generateDynamicMermaidFlowchart({...fullMap, config: config});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDiagramError(errorMessage);
      
      ErrorService.displayError(ErrorType.MERMAID_PARSING, {
        title: 'Mermaid Diagram Error',
        message: ErrorService.getMermaidErrorMessage(error instanceof Error ? error : new Error(errorMessage)),
        error: error as Error
      });
      
      throw error;
    }
  };

  const updateMapValuesWithDefault = (fullMap: fullMermaidMap) => {
    fullMap.nodes.forEach((node) => {
      node.data = {};
    });
    fullMap.subGraphs.forEach((subGraph) => {
      subGraph.data = {};
      subGraph.styles = [];
    });
  };

  const applyAllRules = (
    bindingRules: YamlBindRule[], 
    stylingRules: YamlStylingRule[], 
    fullMap: fullMermaidMap, 
    rows: Record<string, any>[], 
    grafanaVariables: TypedVariableModel[] | null
  ) => {
    const sortedBindingRules = sortByPriority(bindingRules);
    const sortedStylingRules = sortByPriority(stylingRules);
    
    sortedBindingRules.forEach(rule => {
      if (rule.function) {
        findAndApplyBindings(fullMap, rule, rows, grafanaVariables);
      } else if (rule.bindData) {
        getElements(rule, fullMap).forEach(element => {
          let mapElement = findElementInMaps(element, fullMap);
          if (mapElement) {
            addActions({bindData: rule.bindData}, mapElement);
          }
        });
      }
    });
    
    bindData(fullMap);
    
    sortedStylingRules.forEach(rule => {
      if (rule.function) {
        findAndApplyStyling(fullMap, rule, grafanaVariables);
      } else if (rule.applyClass||rule.applyShape||rule.applyStyle||rule.applyText) {
        getElements(rule, fullMap).forEach(element => {
          let mapElement = findElementInMaps(element, fullMap);
          if (mapElement) {
            const action = rule.getActions().Action
            addActions(action, mapElement);
          }
        });
      }
    });
  };

  const evaluateCondition = (
    condition: string, 
    row: Record<string, any> | undefined, 
    grafanaVariables: TypedVariableModel[] | null
  ): boolean => {
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

  const determineAction = (
    rule: YamlBindRule | YamlStylingRule, 
    row: Record<string, any> | undefined, 
    grafanaVariables: TypedVariableModel[] | null
  ): ConditionElement[] | null => {
    let matchedAction: ConditionElement[] = [];
    let func = rule.function;
    
    if (!func) {
      return null;
    }
    
    let valueFound = false;
    
    if (func.if && evaluateCondition(func.if.condition, row, grafanaVariables)) {
      matchedAction.push(func.if); 
      valueFound = true;
    } else if (func.else_if) {
      const elseIfArray = Array.isArray(func.else_if) ? func.else_if : [func.else_if];
      for (const elseIf of elseIfArray) {
        if (evaluateCondition(elseIf.condition, row, grafanaVariables)) {
          matchedAction.push(elseIf);
          valueFound = true;
          break;
        }
      }
    }
    
    if (func.else && !valueFound) {
      matchedAction.push({action: func.else.action, condition: 'true'});
    }

    return matchedAction.length > 0 ? matchedAction : null;
  };

  const findAndApplyBindings = (
    map: fullMermaidMap, 
    rule: YamlBindRule, 
    rows: Record<string, any>[], 
    grafanaVariables: TypedVariableModel[] | null
  ) => {
    rows.some((row) => {
      const actionDataList = determineAction(rule, row, grafanaVariables);
      if (actionDataList) {
        let elementList: string[] = getElements(rule, map);
        elementList.forEach(element => {
          let elementInMap = findElementInMaps(element, map);
          if (elementInMap) {
            actionDataList.forEach(action => {
              if (action.action.bindData) {
                addActions({bindData: action.action.bindData}, elementInMap, row, grafanaVariables);
              }else{
                addActions({bindData: []}, elementInMap, row, grafanaVariables);
              }
            });
          }
        });
      }
      return actionDataList !== null;
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

  const applyClassAction = (Action: Action, Element: BaseObject) => {
    if (Action.applyClass) {
      Action.applyClass.forEach((className: string) => {
        const classIndex = Element.classes.indexOf(className);
        if (classIndex !== -1) {
          Element.classes.splice(classIndex, 1);
        }
        Element.classes.push(className);
      });
    }
  };
  
  const applyStyleAction = (Action: Action, Element: BaseObject) => {
    if (Action.applyStyle) {
      Action.applyStyle.forEach((styleName: string) => {
        const [property] = styleName.split(':');
        const existingStyleIndex = Element.styles.findIndex(style => style.startsWith(property + ':'));
        if (existingStyleIndex !== -1) {
          Element.styles.splice(existingStyleIndex, 1, styleName);
        } else {
          Element.styles.push(styleName);
        }
      });
    }
  };

  const applyTextAction = (Action: Action, Element: BaseObject) => {
    if (Action.applyText) {
      const text = bindDataToString(Action.applyText, Element);
      if ('title' in Element) {
        Element.title = text;
      } else if ('text' in Element) {
        Element.text = text;
      }
    }
  };
  
  const isValidShape = (shape: any): shape is FlowVertexTypeParam => validShapes.has(shape);
  
  const applyShapeAction = (Action: Action, Element: BaseObject) => {
    if (Action.applyShape) {
      if (isValidShape(Action.applyShape)) {
        (Element as FlowVertex).type = Action.applyShape;
      }
    }
  };

  const addActions = (
    Action: Action,
    Element: BaseObject,
    row?: any,
    grafanaVariables?: TypedVariableModel[] | null
  ) => {
    Object.keys(Action).forEach(action => {
      switch (action) {
        case "bindData":
          bindDataAction(Action, Element, row, grafanaVariables);
          break;
        case "applyClass":
          applyClassAction(Action, Element);
          break;
        case "applyStyle":
          applyStyleAction(Action, Element);
          break;
        case "applyText":
          applyTextAction(Action, Element);
          break;
        case "applyShape":
          applyShapeAction(Action, Element);
          break;
        case "applyLink":
          break;
        default:
          console.warn(`Unknown action type: ${action}`);
      }
    });
  };

  const getElements = (rule: YamlBindRule | YamlStylingRule, map: fullMermaidMap): string[] => {
    let elementList: string[] = [];
    if (rule.elements) {
      rule.elements.forEach(element => {
        if (element === 'all' || element === 'nodes' || element === 'subgraphs') {
          const elementsFromMap = findAllElementsInMaps(map, element);
          elementList.push(...elementsFromMap);
        }
        elementList.push(element);
      });
    } else {
      const elementsFromMap = findAllElementsInMaps(map);
      elementList.push(...elementsFromMap);
    }
    elementList = [...new Set(elementList)];
    return elementList;
  };

  const findAndApplyStyling = (
    fullMap: fullMermaidMap, 
    rule: YamlStylingRule, 
    grafanaVariables: TypedVariableModel[] | null
  ) => {
    let elementList: string[] = getElements(rule, fullMap);
    elementList.forEach(object => {
      let mapElement = findElementInMaps(object, fullMap);
      if (mapElement && mapElement.data && Object.keys(mapElement.data).length > 0) {
        const actionDataList = determineAction(rule, mapElement.data, grafanaVariables);
        if (actionDataList) {
          actionDataList.forEach(action => {
            if (action.action.bindData) {
              delete action.action.bindData;
            }
            addActions(action.action, mapElement as FlowVertex, rule);
          });
        }
      }
    });
  };

  const isValidTemplate = (template: string | undefined): boolean => {
    if (!template) return false;
    const trimmedTemplate = template.trim();
    return trimmedTemplate.length > 0;
  };

  const handleElementDoubleClick = (event: MouseEvent) => {
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
    onOptionsChange({...options, yamlConfig: newYamlConfig});
  };

  useEffect(() => {
    if (!isValidTemplate(template)) {
      setIsLoading(false);
      setDiagramError('Template is empty or contains only whitespace');
      return;
    }
    
    setIsLoading(true);
    setDiagramError(null);
    
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
                  
                  svgElement.addEventListener('dblclick', handleElementDoubleClick);
                }
                setIsLoading(false);
                
                ErrorService.displaySuccess('Diagram Loaded', 'Mermaid diagram rendered successfully');
              }
            })
            .catch((error) => {
              console.error('Error rendering diagram:', error);
              setIsLoading(false);
              setDiagramError('Failed to render diagram');
              
              ErrorService.displayError(ErrorType.MERMAID_PARSING, {
                title: 'Diagram Rendering Error',
                message: 'Failed to render Mermaid diagram',
                error
              });
            });
        }
      })
      .catch((error) => {
        console.error('Error fetching diagram data:', error);

        ErrorService.displayError(ErrorType.MERMAID_PARSING, {
          title: 'Error fetching diagram data',
          message: 'Failed to fetching Mermaid diagram',
          error
        });
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
  }, [template, variableChangeCount, data, parsedYamlState]);


  if (!yamlConfig || !isValidTemplate(template) || parsedYamlState.parseError !== null) {
    return (
      <NoTemplatesProvidedDisplay 
        onConfigChanges={(yaml, template) => onOptionsChange({...options, yamlConfig: yaml, template: template})} 
        yamlConfig={yamlConfig} 
        template={template} 
      />
    );
  }

  if (parsedYamlState.parseError) {
    return <div>Error parsing YAML: {parsedYamlState.parseError}</div>;
  }

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
        yamlConfig={{
          bindingRules: parsedYamlState.bindingRules,
          stylingRules: parsedYamlState.stylingRules
        }}
        onYamlConfigChange={handleYamlConfigChange}
      />
    </div>
  );
};