import React, { useState, useEffect } from 'react';
import { Modal, Button, TabsBar, Tab, Grid, LoadingPlaceholder, LoadingBar, useSplitter, Text, Icon, IconButton, Label, Drawer } from '@grafana/ui';
import { YamlBindRule, YamlStylingRule, BaseObject, FlowClass } from 'types/types';
import { RuleDisplay } from '../displays/RuleDisplay';
import { css } from '@emotion/css';
import * as yaml from 'js-yaml';
import { getElementRules, getElementTypeInBaseObject } from 'utils/TransformationUtils';
import { CreateRuleModal } from './CreateRule';

interface EditRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: string[]
  possibleClasses: Map<string, FlowClass>
  yamlConfig: {bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[]};
  onYamlConfigChange: (newYamlConfig: string) => void;
}

export const EditRules: React.FC<EditRulesModalProps> = ({
  isOpen,
  onClose,
  possibleClasses,
  yamlConfig,
  elements,
  onYamlConfigChange,
}) => {
  const [activeTab, setActiveTab] = useState<'bindingRules' | 'stylingRules'>('bindingRules');
  const [parsedYaml, setParsedYaml] = useState<{bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[]}>({bindingRules: [], stylingRules: []});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Separate state for active rules
  const [activeBindRule, setActiveBindRule] = useState<YamlBindRule | null>(null);
  const [activeStyleRule, setActiveStyleRule] = useState<YamlStylingRule | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [elementRules, setElementRules] = useState<{ bindingRules: YamlBindRule[]; stylingRules: YamlStylingRule[] }>({
    bindingRules: [],
    stylingRules: [],
  });
  
  const { containerProps, primaryProps, secondaryProps, splitterProps } = useSplitter({
    direction: 'row',
    initialSize: 0.1,
    dragPosition: 'start',
  });

  const CreateRule = () => {
    setIsModalOpen(true);
  };

  const handleRuleDelete = (rule: YamlBindRule | YamlStylingRule) => {
    const updatedYamlConfig = { ...yamlConfig };
    
    if (rule instanceof YamlBindRule) {
      updatedYamlConfig.bindingRules = updatedYamlConfig.bindingRules.filter(r => r.id !== rule.id);
      
      setElementRules(prev => ({
        ...prev,
        bindingRules: prev.bindingRules.filter(r => r.id !== rule.id)
      }));
      
      setActiveBindRule(elementRules.bindingRules.length > 1 ? 
        elementRules.bindingRules.find(r => r.id !== rule.id) || null : null);
        
    } else if (rule instanceof YamlStylingRule) {
      updatedYamlConfig.stylingRules = updatedYamlConfig.stylingRules.filter(r => r.id !== rule.id);
      
      setElementRules(prev => ({
        ...prev,
        stylingRules: prev.stylingRules.filter(r => r.id !== rule.id)
      }));
      
      setActiveStyleRule(elementRules.stylingRules.length > 1 ? 
        elementRules.stylingRules.find(r => r.id !== rule.id) || null : null);
    }
    
    const newYamlConfigString = convertToYaml(updatedYamlConfig);
    onYamlConfigChange(newYamlConfigString);
  };

  const handleRuleSubmit = (rule: YamlBindRule | YamlStylingRule) => {
    const updatedYamlConfig = { ...yamlConfig };

    if (rule instanceof YamlBindRule) {
      updatedYamlConfig.bindingRules.push(rule);
      setElementRules(prev => ({
        ...prev,
        bindingRules: [...prev.bindingRules, rule]
      }));
      
      setActiveTab('bindingRules');
      setActiveBindRule(rule);
    } else if (rule instanceof YamlStylingRule) {
      updatedYamlConfig.stylingRules.push(rule);
      setElementRules(prev => ({
        ...prev,
        stylingRules: [...prev.stylingRules, rule]
      }));
    
      setActiveTab('stylingRules');
      setActiveStyleRule(rule);
    }
    const newYamlConfigString = convertToYaml(updatedYamlConfig)

    onYamlConfigChange(newYamlConfigString);
  };

  const handleRuleEdit = (rule: YamlBindRule | YamlStylingRule, oldRuleId: string) => {
    const updatedYamlConfig = { ...yamlConfig };
  
    if (rule instanceof YamlBindRule) {
      const ruleIndex = updatedYamlConfig.bindingRules.findIndex(r => r.id === oldRuleId);
      
      if (ruleIndex !== -1) {
        updatedYamlConfig.bindingRules[ruleIndex] = rule;
      }

      setElementRules(prev => ({
        ...prev,
        bindingRules: prev.bindingRules.map(r =>
          r.id === oldRuleId ? rule : r
        )
      }))
       
      setActiveTab('bindingRules');
      setActiveBindRule(rule)

    } else if (rule instanceof YamlStylingRule) {
      const ruleIndex = updatedYamlConfig.stylingRules.findIndex(r => r.id === oldRuleId);
      
      if (ruleIndex !== -1) {
        updatedYamlConfig.stylingRules[ruleIndex] = rule;
      }
  
      setElementRules(prev => ({
        ...prev,
        stylingRules: prev.stylingRules.map(r =>
          r.id === oldRuleId ? rule : r
        )
      }))
      
      setActiveTab('stylingRules');
      setActiveStyleRule(rule);

    }
    const newYamlConfigString = convertToYaml(updatedYamlConfig);
    onYamlConfigChange(newYamlConfigString);
  };

  const convertToYaml = (jsonObject: any): string => {
    try {
      const cleanObject = JSON.parse(JSON.stringify(jsonObject));
      
      const yamlString = yaml.dump(cleanObject, {
        indent: 2,
        lineWidth: -1,
        noArrayIndent: false
      });
  
      return yamlString;
    } catch (error) {
      console.error('Error converting to YAML:', error);
      return '';
    }
  };

  useEffect(() => {
    try {
      setParsedYaml({
        bindingRules: yamlConfig.bindingRules || [],
        stylingRules: yamlConfig.stylingRules || [],
      });
    } catch (e) {
      console.error('Error parsing YAML:', e);
    }
  }, [yamlConfig]);

  useEffect(() => {
    setIsLoading(true)
    setActiveBindRule(null);
    setActiveStyleRule(null);
    setIsLoading(false)
  }, [parsedYaml]);

  const handleClose = () => {
    setActiveTab('bindingRules')
    setActiveBindRule(null)
    setActiveStyleRule(null)
    onClose(); 
  };

  if (!isOpen) return null;

  // Determine which rules and active rule to display based on the current tab
  const rulesToDisplay = activeTab === 'bindingRules' 
    ? elementRules.bindingRules 
    : elementRules.stylingRules;
  
  const activeRule = activeTab === 'bindingRules' 
    ? activeBindRule 
    : activeStyleRule;

  const setActiveRule = (rule: YamlBindRule | YamlStylingRule) => {
    if (rule instanceof YamlBindRule) {
      setActiveBindRule(rule);
      setActiveTab('bindingRules');
    } else {
      setActiveStyleRule(rule);
      setActiveTab('stylingRules');
    }
  };

  return (
    <Modal
      className={css`
        width: 900px;
        height: 700px;
        display: flex;
        flex-direction: column;
      `}
      title={`Rules: `}
      isOpen={isOpen}
      onDismiss={handleClose}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', marginBottom: '5px' }}>
        <Text element={'h5'}>Add a new Rule:</Text>      
        <IconButton 
          className={css`
            margin-left: 5px;
            background: linear-gradient(45deg, #FFA500,rgb(255, 102, 0)); 
            color: black; 
            border: none;
            border-radius: 4px; 
            padding: 1px; 
            transition: background 0.3s ease; 
            &:hover {
              background: linear-gradient(45deg, #FF8C00, #FFA500); 
            }
          `}
          name={'plus'} 
          aria-label="newRule" 
          size="xxxl" 
          variant="secondary" 
          onClick={CreateRule}
        />
      </div>
      
      {isModalOpen && <CreateRuleModal
        possibleClasses={possibleClasses}
        totalRuleCount={parsedYaml.bindingRules.length + parsedYaml.stylingRules.length}
        elements={elements}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRuleSubmit}
      />}
      
      <TabsBar>
        <Tab
          label="Binding Rules"
          active={activeTab === "bindingRules"}
          onChangeTab={() => {
            setActiveTab("bindingRules")
          }}
        />
        <Tab
          label="Styling Rules"
          active={activeTab === "stylingRules"}
          onChangeTab={() => {
            setActiveTab("stylingRules")
          }}
        />
      </TabsBar>
      
      <div
        style={{
          marginTop: "3px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isLoading ? (
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: center;
              flex: 1;
            `}
          >
            <LoadingBar width={500} />
          </div>
        ) : (
          <div>
            <div
              {...containerProps}
              className={css`
                display: flex;
                flex-direction: row;
                width: 100%;
                height: 500px;
              `}
            >
              <div
                {...primaryProps}
                className={css`
                  display: flex;
                  flex-direction: column;
                  width: 125px;
                  overflow-y: auto;
                `}
              >
                {rulesToDisplay.map((rule) => (
                  <Tab
                    key={rule.id}
                    label={rule.id}
                    active={activeRule === rule}
                    onChangeTab={() => {
                      setActiveRule(rule);
                    }}
                  />
                ))}
              </div>
              
              <div {...splitterProps}></div>
              
              <div
                {...secondaryProps}
                className={css`
                  width: "100%";
                `}
              >
                {activeRule && (
                  <RuleDisplay
                    onDelete={(rule)=>{handleRuleDelete(rule)}}
                    elements={elements}
                    possibleClasses={possibleClasses}
                    onEditSubmit={handleRuleEdit}
                    textSize="span"
                    labelSize="span"
                    rule={activeRule}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};