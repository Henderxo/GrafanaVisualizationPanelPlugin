import React, { useState, useEffect } from 'react';
import { Modal, Button, TabsBar, Tab, Grid, LoadingPlaceholder, LoadingBar, useSplitter, Text, Icon, IconButton, Label, Drawer } from '@grafana/ui';
import { YamlBindRule, YamlStylingRule, BaseObject, YamlFunction } from 'types/types';
import { RuleDisplay } from '../displays/RuleDisplay';
import { css } from '@emotion/css';
import { getElementRules, getElementTypeInBaseObject } from 'utils/TransformationUtils';
import { CreateRuleModal } from './CreateRule';

interface ElementConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: BaseObject | null;
  elements: string[]
  yamlConfig: {bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[], functions: YamlFunction[]};
  onYamlConfigChange: (newYamlConfig: string) => void;
}

export const ElementConfigModal: React.FC<ElementConfigModalProps> = ({
  isOpen,
  onClose,
  element,
  yamlConfig,
  elements,
  onYamlConfigChange,
}) => {
  const [activeTab, setActiveTab] = useState<'bindingRules' | 'stylingRules'>('bindingRules');
  const [parsedYaml, setParsedYaml] = useState<{bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[], functions: YamlFunction[]}>({bindingRules: [], stylingRules: [], functions: []});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeRule, setActiveRule] = useState<YamlBindRule | YamlStylingRule | null>(null); // Track selected rule
  const [isModalOpen, setIsModalOpen] = useState(false);
  const CreateRule = () => {
    setIsModalOpen(true);
  };
  const handleRuleSubmit = (rule: YamlBindRule | YamlStylingRule) => {
    setIsModalOpen(false);
  };
  const [elementRules, setElementRules] = useState<{ bindingRules: YamlBindRule[]; stylingRules: YamlStylingRule[] }>({
    bindingRules: [],
    stylingRules: [],
  });
  const { containerProps, primaryProps, secondaryProps, splitterProps } = useSplitter({
    direction: 'row',
    initialSize: 0.1,
    dragPosition: 'start',

  });

  useEffect(() => {
    try {
      setParsedYaml({
        bindingRules: yamlConfig.bindingRules || [],
        stylingRules: yamlConfig.stylingRules || [],
        functions: yamlConfig.functions || []
      });
      console.log()
    } catch (e) {
      console.error('Error parsing YAML:', e);
    }
  }, [yamlConfig]);

  useEffect(() => {
    if (!element) return;
    setIsLoading(true)
    const elementRules = getElementRules(element, [parsedYaml.bindingRules, parsedYaml.stylingRules])
    setElementRules({
      bindingRules: elementRules.bindRules,
      stylingRules: elementRules.stylingRules
    });
    setActiveRule(elementRules.bindRules[0]??null)
    setIsLoading(false)
  }, [element, parsedYaml]);

  // Reset element rules when the modal is closed
  const handleClose = () => {
    //setElementRules({ bindingRules: [], stylingRules: [] }); // Clear the rules
    setActiveTab('bindingRules')
    setActiveRule(null)
    onClose(); // Call the passed onClose prop to close the modal
  };

  if (!isOpen) return null;

  const rulesToDisplay =
    activeTab === 'bindingRules' ? elementRules.bindingRules : elementRules.stylingRules;

    return (
      <Modal
        className={css`
          width: 900px;
          height: 700px;
          display: flex;
          flex-direction: column;
        `}
        title={`Configure Element: ${element?.id || "Unknown"}`}
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
            variant="secondary" onClick={CreateRule}/>

        </div>
        {isModalOpen && <CreateRuleModal 
        elements={elements}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRuleSubmit}/>}
        {" "}
        <TabsBar>
          <Tab
            label="Binding Rules"
            active={activeTab === "bindingRules"}
            onChangeTab={() => setActiveTab("bindingRules")}
          />
          <Tab
            label="Styling Rules"
            active={activeTab === "stylingRules"}
            onChangeTab={() => setActiveTab("stylingRules")}
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
                {
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
                        label={rule.id}
                        active={activeRule === rule}
                        onChangeTab={() => {
                          setActiveRule(rule);
                        }}
                      />
                    ))}
                  </div>
                }
                <div {...splitterProps}></div>
                <div
                  {...secondaryProps}
                  className={css`
                    width: "100%";
                  `}
                >
                  {activeRule && (
                    <RuleDisplay
                      functions={parsedYaml.functions}
                      textSize="span"
                      labelSize="span"
                      rule={activeRule}
                    ></RuleDisplay>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
};
