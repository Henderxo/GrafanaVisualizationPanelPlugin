import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import { Modal, Button, TabsBar, Tab, Grid } from '@grafana/ui';
import { YamlBindRule, YamlStylingRule, BaseObject } from 'types/types';
import { RuleDisplay } from './RuleDisplay';
import { css } from '@emotion/css';
import RuleGrid from './GridLayout';

interface ElementConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: BaseObject | null;
  yamlConfig: string;
  onYamlConfigChange: (newYamlConfig: string) => void;
}

export const ElementConfigModal: React.FC<ElementConfigModalProps> = ({
  isOpen,
  onClose,
  element,
  yamlConfig,
  onYamlConfigChange,
}) => {
  const [activeTab, setActiveTab] = useState<'bindingRules' | 'stylingRules'>('bindingRules');
  const [parsedYaml, setParsedYaml] = useState<any>({});
  const [activeRule, setActiveRule] = useState<YamlBindRule | YamlStylingRule | null>(null); // Track selected rule
  const [elementRules, setElementRules] = useState<{ bindingRules: YamlBindRule[]; stylingRules: YamlStylingRule[] }>({
    bindingRules: [],
    stylingRules: [],
  });

  useEffect(() => {
    try {
      const parsed = yaml.load(yamlConfig) || {};
      setParsedYaml({
        bindingRules: parsed.bindingRules || [],
        stylingRules: parsed.stylingRules || [],
      });
    } catch (e) {
      console.error('Error parsing YAML:', e);
    }
  }, [yamlConfig]);

  useEffect(() => {
    if (!element) return;
    const elementId = element.id || '';

    setElementRules({
      bindingRules: parsedYaml.bindingRules.filter((rule: YamlBindRule) => rule.elements?.includes(elementId)),
      stylingRules: parsedYaml.stylingRules.filter((rule: YamlStylingRule) => rule.elements?.includes(elementId)),
    });
  }, [element, parsedYaml]);

  // Reset element rules when the modal is closed
  const handleClose = () => {
    setElementRules({ bindingRules: [], stylingRules: [] }); // Clear the rules
    onClose(); // Call the passed onClose prop to close the modal
  };

  if (!isOpen) return null;

  const rulesToDisplay =
    activeTab === 'bindingRules' ? elementRules.bindingRules : elementRules.stylingRules;

  return (
    <Modal className={css`
                width: 1750px;
                height: 800px;
              `} 
            title={`Configure Element: ${element?.id || 'Unknown'}`} 
            isOpen={isOpen} 
            onDismiss={handleClose}> {/* Use handleClose to reset rules on close */}
      <TabsBar>
        <Tab label="Binding Rules" active={activeTab === 'bindingRules'} onChangeTab={() => setActiveTab('bindingRules')} />
        <Tab label="Styling Rules" active={activeTab === 'stylingRules'} onChangeTab={() => setActiveTab('stylingRules')} />
      </TabsBar>

      {/* Add a key prop to force re-render of RuleGrid when switching tabs */}
      <div style={{marginTop: '28px' }}>
        {/* <RuleGrid ></RuleGrid> */}
        <div>
            <Grid columns={3} gap={5}>
                {rulesToDisplay.map((rule) => (
                    <RuleDisplay rule={rule} height={'285px'} />
                ))}
            </Grid>
        </div>
        <Modal.ButtonRow>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
        </Modal.ButtonRow>
      </div>

        

    </Modal>
  );
};
