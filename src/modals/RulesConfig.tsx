import React, { useState, useEffect } from 'react';
import { Modal, TabsBar, Tab, LoadingBar, useSplitter, Text, IconButton } from '@grafana/ui';
import { YamlBindRule, YamlStylingRule, BaseObject, FlowClass, YamlParsedConfig } from 'types/types';
import { RuleDisplay } from '../displays/RuleDisplay';
import { css } from '@emotion/css';
import { getElementRules } from 'utils/TransformationUtils';
import { convertToYaml } from 'utils/YamlUtils';
import { ConfigureRule } from './ConfigureRule';

interface RulesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  element?: BaseObject | null;
  elements: string[]
  possibleClasses: Map<string, FlowClass>
  yamlConfig: YamlParsedConfig;
  onYamlConfigChange: (newYamlConfig: string) => void;
}

export const RulesConfig: React.FC<RulesConfigModalProps> = ({
  isOpen,
  onClose,
  element,
  possibleClasses,
  yamlConfig,
  elements,
  onYamlConfigChange,
}) => {
  const [activeTab, setActiveTab] = useState<'bindingRules' | 'stylingRules'>('bindingRules');
  const [parsedYaml, setParsedYaml] = useState<{bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[]}>({bindingRules: [], stylingRules: []});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
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
    setIsLoading(true)
    const updatedYamlConfig = { ...yamlConfig };
    
    if (rule instanceof YamlBindRule) {
      updatedYamlConfig.bindingRules = updatedYamlConfig.bindingRules.filter(r => r.id !== rule.id)
      setActiveBindRule(null)
      setActiveTab('bindingRules');
    } else if (rule instanceof YamlStylingRule) {
      updatedYamlConfig.stylingRules = updatedYamlConfig.stylingRules.filter(r => r.id !== rule.id);
      setActiveStyleRule(null)
      setActiveTab('stylingRules');
    }
    
    const newYamlConfigString = convertToYaml(updatedYamlConfig);
    setIsLoading(false)
    onYamlConfigChange(newYamlConfigString);
  };

  const handleRuleSubmit = (rule: YamlBindRule | YamlStylingRule) => {
    setIsLoading(true)
    const updatedYamlConfig = { ...yamlConfig };

    if (rule instanceof YamlBindRule) {
      updatedYamlConfig.bindingRules.push(rule);
      setActiveBindRule(rule)
      setActiveTab('bindingRules');
    } else if (rule instanceof YamlStylingRule) {
      updatedYamlConfig.stylingRules.push(rule);
      setActiveStyleRule(rule)
      setActiveTab('stylingRules');
    }
    const newYamlConfigString = convertToYaml(updatedYamlConfig)
    setIsLoading(false)
    onYamlConfigChange(newYamlConfigString);
  };

  const handleRuleEdit = (rule: YamlBindRule | YamlStylingRule, oldRuleId: string) => {
    setIsLoading(true)
    const updatedYamlConfig = { ...yamlConfig };
  
    if (rule instanceof YamlBindRule) {
      const ruleIndex = updatedYamlConfig.bindingRules.findIndex(r => r.id === oldRuleId);
      
      if (ruleIndex !== -1) {
        updatedYamlConfig.bindingRules[ruleIndex] = rule;
      }
      if(element){
        rule.elements&&rule.elements.includes(element.id??'')?setActiveBindRule(rule):setActiveBindRule(null)
      }else{
        setActiveBindRule(rule)
      }
      setActiveTab('bindingRules');

    } else if (rule instanceof YamlStylingRule) {
      const ruleIndex = updatedYamlConfig.stylingRules.findIndex(r => r.id === oldRuleId);
      
      if (ruleIndex !== -1) {
        updatedYamlConfig.stylingRules[ruleIndex] = rule;
      }
  
      if(element){ 
        rule.elements&&rule.elements.includes(element.id??'')?setActiveStyleRule(rule):setActiveStyleRule(null)
      }else{
        setActiveStyleRule(rule)
      }
      setActiveTab('stylingRules');
    }
    const newYamlConfigString = convertToYaml(updatedYamlConfig);
    onYamlConfigChange(newYamlConfigString);
    setIsLoading(false)
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
    const elementRuless = element?getElementRules(element, [parsedYaml.bindingRules, parsedYaml.stylingRules]):parsedYaml
    setElementRules({
      bindingRules: elementRuless.bindingRules.map(rule => new YamlBindRule(rule)),
      stylingRules: elementRuless.stylingRules.map(rule => new YamlStylingRule(rule))
    });
    setIsLoading(false)
  }, [element, parsedYaml]);

  const handleClose = () => {
    setActiveTab('bindingRules')
    setActiveBindRule(null)
    setActiveStyleRule(null)
    onClose(); 
  };

  if (!isOpen) return null;

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
      title={element?`Configure Element: ${element?.id || "Unknown"}`:`Configure Rules`}
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
          size={`xl`}
          aria-label="newRule" 
          variant="secondary" 
          onClick={CreateRule}
        />
      </div>
      {isModalOpen && <ConfigureRule
        possibleClasses={possibleClasses}
        totalRuleCount={parsedYaml.bindingRules.length + parsedYaml.stylingRules.length}
        elements={elements}
        isOpen={isModalOpen}
        element={element?.id??undefined}
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
                    active={JSON.stringify(activeRule) === JSON.stringify(rule)}
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
                {activeRule && !isLoading && (
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