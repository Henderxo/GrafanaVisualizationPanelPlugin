import React, { useRef, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { Icon, Text } from '@grafana/ui';
import { RulesConfig } from 'modals/RulesConfig';
import { FlowClass, fullMermaidMap, YamlParsedConfig } from 'types/types';
import { css } from '@emotion/css';
import ButtonWrapper from 'components/wrappers/ButtonWrapper';
import { parseYamlConfig } from 'utils/YamlUtils';

export const RulesConfigButton: React.FC<StandardEditorProps<string, any, SimpleOptions>> = ({ 
  value, 
  onChange,
  context 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { options } = context;
  const fullMapRef = useRef<fullMermaidMap | null>(null);
  const [parsedYaml, setParsedYaml] = useState<YamlParsedConfig>({bindingRules: [], stylingRules: [], parseError: null});
  
  if (options?.diagramMap) {
    fullMapRef.current = options.diagramMap;
  }

  const openModal = () => {
    const parsedYamlConfig = parseYamlConfig(value)
    setParsedYaml(parsedYamlConfig)
    setIsModalOpen(true);
  };
  
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
        <RulesConfig
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