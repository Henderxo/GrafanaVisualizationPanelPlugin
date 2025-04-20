import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { PanelData, TypedVariableModel } from '@grafana/data';
import { DiagramDBResponse, SimpleOptions } from 'types';
import createPanZoom from 'panzoom';
import {fullMermaidMap, BaseObject, FlowClass, YamlParsedConfig } from '../../types';
import { extractMermaidConfigString, extractMermaidDiagramType, generateDynamicMermaidFlowchart } from 'utils/MermaidUtils';
import { extractTableData, reformatDataFromResponse, } from 'utils/TransformationUtils';
import { mapDataToRows } from 'utils/TransformationUtils';
import { RulesConfig } from '../../modals/RulesConfig';
import { getTemplateSrv, locationService } from '@grafana/runtime';
import { NoTemplatesProvidedDisplay } from 'displays/NoTemplatesProvidedDisplay';
import { ErrorService, ErrorType } from 'services/ErrorService';
import { parseYamlConfig } from 'utils/YamlUtils';
import { applyAllRules } from 'utils/RuleUtils';
import { findAllElementsInMaps, findElementInMaps } from 'utils/DiagramMapUtils';

interface MainDiagramPanelProps {
  options: SimpleOptions;
  data: PanelData;
  onOptionsChange: (options: SimpleOptions) => void;
}

export const MainDiagramPanel: React.FC<MainDiagramPanelProps> = ({ options, data, onOptionsChange }) => {
  const { yamlConfig, template } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [variableChangeCount, setVariableChangeCount] = useState(0);
  const [selectedElement, setSelectedElement] = useState<BaseObject | null>(null);
  const [allElements, setAllElements] = useState<string[]>([]);
  const [parsedYamlState, setParsedYamlState] = useState<YamlParsedConfig>({
    bindingRules: [],
    stylingRules: []
  });
  const [parseError, setParsedYamlError] = useState<null | string>(null);
  const grafanaVariablesRef = useRef<TypedVariableModel[]>([])
  const chartRef = useRef<HTMLDivElement>(null);
  const fullMapRef = useRef<fullMermaidMap | null>(null);
  
  useEffect(() => {
    if (!yamlConfig) {
      setParsedYamlState({
        bindingRules: [],
        stylingRules: []
      });
      return;
    }

    const [parsedYamlConfig, parsedYamlError] = parseYamlConfig(yamlConfig)
    setParsedYamlError(parsedYamlError)
    setParsedYamlState(parsedYamlConfig)
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
      const type = extractMermaidDiagramType(templateStr)
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
      
      return generateDynamicMermaidFlowchart({...fullMap, config: config, type: type});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      ErrorService.displayError(ErrorType.MERMAID_PARSING, {
        title: 'Mermaid Diagram Error',
        message: ErrorService.getMermaidErrorMessage(error instanceof Error ? error : new Error(errorMessage)),
        error: (error as Error).message
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
      return;
    }
    
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
                  
                  svgElement.addEventListener('dblclick', handleElementDoubleClick);
                }
                setIsLoading(false);
                ErrorService.displaySuccess('Diagram Loaded', 'Mermaid diagram rendered successfully');
              }
            })
            .catch((error) => {
              setIsLoading(false);
              
              ErrorService.displayError(ErrorType.MERMAID_PARSING, {
                title: 'Diagram Rendering Error',
                message: 'Failed to render Mermaid diagram',
                error: (error as Error).message
              });
            });
        }
      })
      .catch((error) => {
        ErrorService.displayError(ErrorType.MERMAID_PARSING, {
          title: 'Error fetching diagram data',
          message: 'Failed to fetching Mermaid diagram',
          error: (error as Error).message
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


  if (!yamlConfig || !isValidTemplate(template) || parseError !== null) {
    return (
      <NoTemplatesProvidedDisplay 
        onConfigChanges={(yaml, template) => onOptionsChange({...options, yamlConfig: yaml, template: template})} 
        yamlConfig={yamlConfig} 
        template={template} 
      />
    );
  }

  if (parseError) {
    return <div>Error parsing YAML: {parseError}</div>;
  }

  return (
    <div>
      {isLoading && <div className="loading-indicator">Loading diagram...</div>}
      <div ref={chartRef} className={isLoading ? "hidden" : ""} />
      
      {isModalOpen && <RulesConfig
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        element={selectedElement}
        elements={allElements}
        possibleClasses={fullMapRef.current?.classes as Map<string, FlowClass>}
        yamlConfig={parsedYamlState}
        onYamlConfigChange={handleYamlConfigChange}
      />}
    </div>
  );
};