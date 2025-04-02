import React, { useRef, useState, useMemo } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { Button, Icon, Text } from '@grafana/ui';
import yaml from 'js-yaml';
import { ElementConfigModal } from 'modals/EditElementModal';
import { FlowClass, fullMermaidMap, YamlBindRule, YamlStylingRule } from 'types/types';
import { css } from '@emotion/css';
import ButtonWrapper from 'components/wrappers/ButtonWrapper';

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
  
  if (options?.diagramMap) {
    fullMapRef.current = options.diagramMap;
  }
  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  if (!parsedYaml && typeof value === 'string') {
    return <div>Error parsing YAML configuration</div>;
  }
  
  return (
    <div>
      <ButtonWrapper
        variant={context.options?.buttonTheme??'primary'}
        className={css`width: 100%; display: flex; justify-content: center;`}
        onClick={openModal} 
        disabled={!fullMapRef.current}
      >
        <Icon name={'edit'} className={css`margin-right: 6px;`}></Icon><Text>Open Rule Configuration</Text>
      </ButtonWrapper>
      
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