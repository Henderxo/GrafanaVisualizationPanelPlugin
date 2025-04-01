import React, { useRef, useState, useMemo } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { Button } from '@grafana/ui';
import yaml from 'js-yaml';
import { ElementConfigModal } from 'modals/EditElementModal';
import { FlowClass, fullMermaidMap, YamlBindRule, YamlStylingRule } from 'types/types';
import { RuleConfigModal } from 'modals/EditRulesModal';

interface YamlConfig {
  bindingRules: YamlBindRule[];
  stylingRules: YamlStylingRule[];
}

export const RuleConfigButton: React.FC<StandardEditorProps<string, any, SimpleOptions>> = ({ 
  value, 
  onChange,
  context 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { options } = context;
  const fullMapRef = useRef<fullMermaidMap | null>(null);
  
  // Parse YAML with error handling
  const parsedYaml = useMemo<YamlConfig>(() => {
    try {
      const parsed = yaml.load(value) as YamlConfig || { bindingRules: [], stylingRules: [] };
      
      return {
        bindingRules: Array.isArray(parsed.bindingRules) ? parsed.bindingRules : [],
        stylingRules: Array.isArray(parsed.stylingRules) ? parsed.stylingRules : []
      };
    } catch (e) {
      console.error('Error parsing YAML:', e);
      return { bindingRules: [], stylingRules: [] };
    }
  }, [value]);
  
  // Store diagram map reference
  if (options?.diagramMap) {
    fullMapRef.current = options.diagramMap;
  }
  
  // Handle opening/closing modal
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  // Error rendering
  if (!parsedYaml && typeof value === 'string') {
    return <div>Error parsing YAML configuration</div>;
  }
  
  return (
    <div>
      <Button 
        onClick={openModal} 
        disabled={!fullMapRef.current}
      >
        Open Element Configuration
      </Button>
      
      {isModalOpen && fullMapRef.current && options?.diagramElements && (
        <ElementConfigModal
          isOpen={true}
          onClose={closeModal}
          elements={options.diagramElements}
          possibleClasses={fullMapRef.current.classes as Map<string, FlowClass>}
          yamlConfig={parsedYaml}
          onYamlConfigChange={onChange}
        />
      )}
    </div>
  );
};