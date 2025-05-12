import React, { useState, useEffect } from 'react';
import { Modal, TabsBar, Tab, LoadingBar, useSplitter, Text, IconButton, Button } from '@grafana/ui';
import { YamlBindRule, YamlStylingRule, BaseObject, FlowClass, YamlParsedConfig } from '../types';
import { RuleDisplay } from '../displays/RuleDisplay';
import { css } from '@emotion/css';
import { convertToYaml } from 'utils/YamlUtils';
import { getElementRules, ruleHasElement } from 'utils/RuleUtils';
import { ConfigureRulenew } from './configureRuleModal/ConfigureRuleNew';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTabWrapper } from 'components/wrappers/SortabletabWrappe';


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
  onClose,
  isOpen,
  element,
  possibleClasses,
  yamlConfig,
  elements,
  onYamlConfigChange,
}) => {
  const [activeTab, setActiveTab] = useState<'bindingRules' | 'stylingRules'>('bindingRules');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [activeBindRule, setActiveBindRule] = useState<YamlBindRule | null>(null);
  const [activeStyleRule, setActiveStyleRule] = useState<YamlStylingRule | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [elementRules, setElementRules] = useState<{ bindingRules: YamlBindRule[]; stylingRules: YamlStylingRule[] }>({
    bindingRules: [],
    stylingRules: [],
  });

  const [workingConfig, setWorkingConfig] = useState<YamlParsedConfig>({bindingRules: [], stylingRules: []});
  const [hasChanges, setHasChanges] = useState(false);

  const [orderedBindingRules, setOrderedBindingRules] = useState<YamlBindRule[]>([]);
  const [orderedStylingRules, setOrderedStylingRules] = useState<YamlStylingRule[]>([]);

  const rulesToDisplay = activeTab === 'bindingRules' 
  ? elementRules.bindingRules
  : elementRules.stylingRules;

const activeRule = activeTab === 'bindingRules' 
  ? activeBindRule 
  : activeStyleRule;
  
  const { containerProps, primaryProps, secondaryProps, splitterProps } = useSplitter({
    direction: 'row',
    initialSize: 0.1,
    dragPosition: 'start',
  });

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const handleDragEnd = (event: DragEndEvent) => {
      if (!workingConfig) {
        return;
      }

      if(element){
        return;
      }
      
      const { active, over } = event;
      
      if (!over || active.id === over.id) {
        return;
      }
      
      const activeId = String(active.id);
      const overId = String(over.id);
      
      if (activeTab === 'bindingRules') {
        const oldIndex = orderedBindingRules.findIndex(rule => rule.name === activeId);
        const newIndex = orderedBindingRules.findIndex(rule => rule.name === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrderedRules = arrayMove(orderedBindingRules, oldIndex, newIndex);
          setOrderedBindingRules(newOrderedRules);
          
          const updatedWorkingConfig = { ...workingConfig };
          updatedWorkingConfig.bindingRules = newOrderedRules;
          setWorkingConfig(updatedWorkingConfig);
          setHasChanges(true);
        }
      } else {
        const oldIndex = orderedStylingRules.findIndex(rule => rule.name === activeId);
        const newIndex = orderedStylingRules.findIndex(rule => rule.name === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrderedRules = arrayMove(orderedStylingRules, oldIndex, newIndex);
          setOrderedStylingRules(newOrderedRules);
          
          const updatedWorkingConfig = { ...workingConfig };
          updatedWorkingConfig.stylingRules = newOrderedRules;
          setWorkingConfig(updatedWorkingConfig);
          setHasChanges(true);
        }
      }
    };

  const handleRuleDelete = (rule: YamlBindRule | YamlStylingRule) => {
    if (!workingConfig) {
      return;
    }
    
    setIsLoading(true);
    const updatedWorkingConfig = { ...workingConfig };
    
    if (rule instanceof YamlBindRule) {
      updatedWorkingConfig.bindingRules = updatedWorkingConfig.bindingRules.filter(r => r.name !== rule.name);
      setActiveBindRule(null);
      setActiveTab('bindingRules');
    } else if (rule instanceof YamlStylingRule) {
      updatedWorkingConfig.stylingRules = updatedWorkingConfig.stylingRules.filter(r => r.name !== rule.name);
      setActiveStyleRule(null);
      setActiveTab('stylingRules');
    }
    
    setWorkingConfig(updatedWorkingConfig);
    setHasChanges(true);
    setIsLoading(false);
  };

  const handleRuleSubmit = (rule: YamlBindRule | YamlStylingRule) => {
    if (!workingConfig) {
      return;
    }
    
    setIsLoading(true);
    const updatedWorkingConfig = { ...workingConfig };

    if (rule instanceof YamlBindRule) {
      updatedWorkingConfig.bindingRules = [...updatedWorkingConfig.bindingRules, rule];
      setActiveBindRule(rule);
      setActiveTab('bindingRules');
    } else if (rule instanceof YamlStylingRule) {
      updatedWorkingConfig.stylingRules = [...updatedWorkingConfig.stylingRules, rule];
      setActiveStyleRule(rule);
      setActiveTab('stylingRules');
    }
    
    setWorkingConfig(updatedWorkingConfig);
    setHasChanges(true);
    setIsLoading(false);
  };

  const handleRuleEdit = (rule: YamlBindRule | YamlStylingRule, oldRuleName: string) => {
    if (!workingConfig) {
      return;
    }
    
    setIsLoading(true);
    const updatedWorkingConfig = { ...workingConfig };
  
    if (rule instanceof YamlBindRule) {
      const ruleIndex = updatedWorkingConfig.bindingRules.findIndex(r => r.name === oldRuleName);
      
      if (ruleIndex !== -1) {
        updatedWorkingConfig.bindingRules[ruleIndex] = rule;
      }
      
      if(element){
        ruleHasElement(rule, element) ? setActiveBindRule(rule) : setActiveBindRule(null);
      } else {
        setActiveBindRule(rule);
      }
      setActiveTab('bindingRules');

    } else if (rule instanceof YamlStylingRule) {
      const ruleIndex = updatedWorkingConfig.stylingRules.findIndex(r => r.name === oldRuleName);
      
      if (ruleIndex !== -1) {
        updatedWorkingConfig.stylingRules[ruleIndex] = rule;
      }
  
      if(element){ 
        ruleHasElement(rule, element) ? setActiveStyleRule(rule) : setActiveStyleRule(null);
      } else {
        setActiveStyleRule(rule);
      }
      setActiveTab('stylingRules');
    }
    
    setWorkingConfig(updatedWorkingConfig);
    setHasChanges(true);
    setIsLoading(false);
  };

  const updateElementRules = (config: YamlParsedConfig | null) => {
    if (!config) {
      return;
    }
    
    setIsLoading(true);
    let filteredRules;
    
    if (element) {
      filteredRules = getElementRules(element, [
        config.bindingRules || [],
        config.stylingRules || []
      ]);
    } else {
      filteredRules = {
        bindingRules: config.bindingRules || [],
        stylingRules: config.stylingRules || []
      };
    }
    
    setElementRules({
      bindingRules: filteredRules.bindingRules.map(rule => new YamlBindRule(rule)),
      stylingRules: filteredRules.stylingRules.map(rule => new YamlStylingRule(rule))
    });
    setIsLoading(false);
  };

  const initializeFromConfig = (config: YamlParsedConfig) => {
    try {
      const parsedData = {
        bindingRules: config.bindingRules || [],
        stylingRules: config.stylingRules || [],
      };
      
      setWorkingConfig({...config, bindingRules: parsedData.bindingRules, stylingRules: parsedData.stylingRules});
    } catch (e) {
      console.error('Error parsing YAML:', e);
    }
  };

  const saveChanges = () => {
    if (workingConfig && hasChanges) {
      const newYamlConfigString = convertToYaml(workingConfig);
      onYamlConfigChange(newYamlConfigString);
      setHasChanges(false);
      handleClose()
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const configCopy = JSON.parse(JSON.stringify(yamlConfig));
    initializeFromConfig(configCopy);
    setHasChanges(false);
    setIsLoading(false);
  }, [yamlConfig]);

  useEffect(()=>{
    updateElementRules(workingConfig)
  }, [workingConfig])

  useEffect(() => {
    setOrderedBindingRules(elementRules.bindingRules);
    setOrderedStylingRules(elementRules.stylingRules);
  }, [elementRules]);

  const handleClose = () => {
    setActiveTab('bindingRules')
    setActiveBindRule(null)
    setActiveStyleRule(null)
    setElementRules({bindingRules: [], stylingRules: []})
    onClose(); 
  };

  if (!isOpen) {
    return null;
  }

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
        width: 1340px;
        height: 850px;
        display: flex;
        flex-direction: column;
      `}
      title={element?`Configure Element: ${element?.id || "Unknown"}`:`Configure Rules`}
      isOpen={isOpen}
      onDismiss={handleClose}
    >
      <div style={{height: '100%'}}>
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
            onClick={()=>setIsModalOpen(true)}
          />
        </div>
        {isModalOpen && <ConfigureRulenew
          possibleClasses={possibleClasses}
          totalRuleCount={workingConfig.bindingRules.length + workingConfig.stylingRules.length}
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
            height: 'auto',
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
            <div style={{height: '55vh'}}>
              <div
                {...containerProps}
                className={css`
                  display: flex;
                  flex-direction: row;
                  width: 100%;
                  height: 100%;
                `}
              >
                <div
                  {...primaryProps}
                  className={css`
                    display: flex;
                    flex-direction: column;
                    width: 125px;
                    overflow-y: auto;
                    overflow-x: hidden;
                  `}
                >
                {!element && <DndContext 
                    modifiers={[restrictToVerticalAxis]}
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={rulesToDisplay.map(rule => rule.name)}
                      strategy={verticalListSortingStrategy}
                    >
                      {rulesToDisplay.map(rule => (
                        <SortableTabWrapper
                          key={rule.name}
                          rule={rule}
                          activeRule={activeRule}
                          onActivate={() => setActiveRule(rule)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>}
                {element && 
                    <>
                    {rulesToDisplay.map(rule => (
                      <Tab
                          key={rule.name}
                          label={rule.name}
                          active={activeRule ? JSON.stringify(activeRule) === JSON.stringify(rule) : false}
                          onChangeTab={() => setActiveRule(rule)}
                        />
                      ))}
                    </>
                  }
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
        <Modal.ButtonRow>
        <Button onClick={handleClose} variant='destructive'>Cancel</Button>
        <Button onClick={saveChanges} disabled={!hasChanges} variant='primary'>Save</Button>
      </Modal.ButtonRow>
      </div>
    </Modal>
  );
};