import React, { useEffect, useRef, useState } from 'react';
import { 
  Modal,   
  Button, 
  Select, 
  Input, 
  useSplitter,
  MultiSelect,
  Text,
  useTheme2,
  LoadingPlaceholder
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { Action, FunctionElement, YamlBindRule, YamlStylingRule } from 'types/types';
import { css } from '@emotion/css';
import RuleInputWrapper from 'components/RuleInputWrapper';
import { FunctionInput } from 'components/FunctionInput';
import { ActionInput } from 'components/ActionInput';
import { RuleCreateActionBar } from 'components/RuleCreateActionBar';


interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rule: YamlBindRule | YamlStylingRule) => void;
  elements: string[],
  element?: string,
  rule?: YamlBindRule | YamlStylingRule
}

interface RuleUIState {
  priorityActionAdded: boolean;
  elementsActionAdded: boolean;
  functionActionAdded: boolean;
  ifActionAdded: boolean;
  elseIfActionAdded: boolean;
  elseActionAdded: boolean;
  generalActionsAdded: boolean;
  ruleType: SelectableValue
}

export const CreateRuleModal: React.FC<CreateRuleModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  elements,
  element,
  rule
}) => {
    //History
    const [stateHistory, setStateHistory] = useState<{
      rule: YamlBindRule | YamlStylingRule,
      uiState: RuleUIState
    }[]>([]);
    const maxHistoryLength = 10;
    //Actions
    const [priorityActionAdded, setPriorityActionAdded] = useState<boolean>(false);
    const [elementsActionAdded, setElementsActionAdded] = useState<boolean>(false);
    const [functionActionAdded, setFunctionActionAdded] = useState<boolean>(false);
    const [ifActionAdded, setIfActionAdded] = useState<boolean>(false);
    const [elseIfActionAdded, setElseIfActionAdded] = useState<boolean>(false);
    const [elseActionAdded, setelseActionAdded] = useState<boolean>(false);
    const [generalActionsAdded, setGeneralActionsAdded] = useState<boolean>(false);
    //General
    const [isFunctionLoaded, setIsFunctionLoaded] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<'if' | 'else_if' | 'else'>('if');
    const  [ElementList, setElementList] = useState<SelectableValue[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [areElementsLoading, setElementsAreLoading] = useState<boolean>(false)
    const newRuleRef = useRef<YamlBindRule | YamlStylingRule>(new YamlBindRule({id: ''}));
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const theme = useTheme2();

    const saveStateToHistory = (state?: YamlBindRule | YamlStylingRule) => {
      setStateHistory(prevHistory => {
        const clonedState = state?state.clone():newRuleRef.current.clone()
        const currentUIState: RuleUIState = {
          priorityActionAdded,
          elementsActionAdded,
          functionActionAdded,
          ifActionAdded,
          elseIfActionAdded,
          elseActionAdded,
          generalActionsAdded,
          ruleType
        };
  
        const newHistory = [
          ...prevHistory, 
          { 
            rule: clonedState, 
            uiState: currentUIState 
          }
        ];
        return newHistory.slice(-maxHistoryLength);
      });
    };

    const handleUndo = () => {
      if (stateHistory.length > 0) {
        const previousState = stateHistory[stateHistory.length - 1];

        resetRule(previousState.rule);
        
        setPriorityActionAdded(previousState.uiState.priorityActionAdded);
        setElementsActionAdded(previousState.uiState.elementsActionAdded);
        setFunctionActionAdded(previousState.uiState.functionActionAdded);
        setIfActionAdded(previousState.uiState.ifActionAdded);
        setElseIfActionAdded(previousState.uiState.elseIfActionAdded);
        setelseActionAdded(previousState.uiState.elseActionAdded);
        setGeneralActionsAdded(previousState.uiState.generalActionsAdded);
  
        setStateHistory(prevHistory => prevHistory.slice(0, -1));
      }
    };

    const ruleTypeOptions: SelectableValue[] = [
      { label: 'Binding Rule', value: 'binding' },
      { label: 'Styling Rule', value: 'styling' }
    ];
    
    const [ruleType, setRuleType] = useState<SelectableValue>({
      label: 'Binding Rule', 
      value: 'binding'
    });

    const getGeneralActions = (): Action => {
      let tempAction: Action = {};
      
      if (ruleType.value === 'binding') {
        let tempRule = { ...(newRuleRef.current as YamlBindRule) };
        
        if (tempRule.bindData !== undefined) {
          tempAction.bindData = tempRule.bindData;
        }
      } else {
        let tempRule = { ...(newRuleRef.current as YamlStylingRule) };
    
        if (tempRule.applyClass !== undefined) {
          tempAction.applyClass = tempRule.applyClass;
        }
        if (tempRule.applyStyle !== undefined) {
          tempAction.applyStyle = tempRule.applyStyle;
        }
        if (tempRule.applyShape !== undefined) {
          tempAction.applyShape = tempRule.applyShape;
        }
        if (tempRule.applyText !== undefined) {
          tempAction.applyText = tempRule.applyText;
        }
      }
    
      return tempAction;
    };

    const handleRuleTypeChange = (selectedType: SelectableValue) => {
      handleFunctionChange(undefined)
      newRuleRef.current = selectedType.value === 'binding' 
        ? new YamlBindRule({...newRuleRef.current, id: newRuleRef.current.id})
        : new YamlStylingRule({...newRuleRef.current, id: newRuleRef.current.id});
      resetRule(newRuleRef.current)
    };

    const handleGeneralRuleChange = (action: Action) => {
      saveStateToHistory(newRuleRef.current);
      const currentRule = newRuleRef.current.clone()
    
      if (currentRule.getRuleType() === 'binding') {
        const bindRule = currentRule as YamlBindRule;
        bindRule.bindData = action.bindData ?? undefined;
        
        newRuleRef.current = bindRule;
      } else if (currentRule.getRuleType() === 'styling') {
        const stylingRule = currentRule as YamlStylingRule;
        
        stylingRule.applyClass = action.applyClass ?? undefined;
        stylingRule.applyText = action.applyText ?? undefined;
        stylingRule.applyStyle = action.applyStyle ?? undefined;
        stylingRule.applyShape = action.applyShape ?? undefined;
        
        newRuleRef.current = stylingRule;
      }
      forceUpdate();
    }

    const handleGeneralRuleDelete = () =>{
      saveStateToHistory(newRuleRef.current);
      const currentRule = newRuleRef.current.clone()

      if (currentRule.getRuleType() === 'binding') {
        const bindRule = currentRule as YamlBindRule;
        bindRule.bindData =  undefined;
        
        newRuleRef.current = bindRule;
      } else if (currentRule.getRuleType() === 'styling') {
        const stylingRule = currentRule as YamlStylingRule;
        
        stylingRule.applyClass = undefined;
        stylingRule.applyText = undefined;
        stylingRule.applyStyle = undefined;
        stylingRule.applyShape = undefined;
        
        newRuleRef.current = stylingRule;
      }
      setGeneralActionsAdded(false)
      forceUpdate();
    }

    const handleFunctionChange = (updatedFunction: string | FunctionElement | undefined, deletedTab?: string) => {
      saveStateToHistory(newRuleRef.current.clone());
      if(updatedFunction){
        newRuleRef.current.function = updatedFunction;
        if(deletedTab){
          if(deletedTab === 'else_if'){
            setElseIfActionAdded(false)
            setActiveTab('if');
          }else{
            setelseActionAdded(false)
            setActiveTab('if');
          }
        }
      }else{
        delete newRuleRef.current.function
        setIfActionAdded(false)
        setFunctionActionAdded(false)
        setElseIfActionAdded(false)
        setelseActionAdded(false)
      }
      forceUpdate()
    };

    const handleRuleInputDelete = (type: 'priority' | 'elements') =>{
      if(newRuleRef.current){
        saveStateToHistory(newRuleRef.current);
        switch(type){
          case 'priority':
            if(newRuleRef.current.priority){
              delete newRuleRef.current.priority
              setPriorityActionAdded(false)
              forceUpdate()
            }
            break;
          case 'elements':
            if(newRuleRef.current.elements){
              delete newRuleRef.current.elements
              setElementsActionAdded(false)
              forceUpdate()
            }
            break;
        }
      }
    }

    const resetRule = (rule?: YamlBindRule | YamlStylingRule) =>{
      if(rule){
        newRuleRef.current = rule.clone()
        reconfigureEditor(rule)
      }else{
        newRuleRef.current = element?new YamlBindRule({id: '', elements: [element]}):new YamlBindRule({id: ''})
        reconfigureEditor(newRuleRef.current)
      }
      forceUpdate()
      setIsLoading(false)
    }

    const reconfigureEditor = (rule: YamlBindRule | YamlStylingRule) =>{
      setPriorityActionAdded(false)
      setElementsActionAdded(false)
      setFunctionActionAdded(false)
      setIfActionAdded(false)
      setelseActionAdded(false)
      setGeneralActionsAdded(false)

      setRuleType(ruleTypeOptions.find(obj => obj.value === rule.getRuleType())??{ label: 'Binding Rule', value: 'binding' })

      rule.priority && setPriorityActionAdded(true);
      rule.elements && setElementsActionAdded(true);

      if(rule.function){
          setFunctionActionAdded(true);
          if(typeof rule.function !== 'string'){
            setIfActionAdded(true);
            if(rule.function.else_if){
              setElseIfActionAdded(true);
            }else if(activeTab === 'else_if'){
              setActiveTab('if')
            }
            if(rule.function.else){
              setelseActionAdded(true);
            }else if(activeTab === 'else'){
              if(rule.function.else_if){
                setActiveTab('else_if')
              }setActiveTab('if')
            }
          }
        }
        if((rule as YamlBindRule).bindData !== undefined){
          setGeneralActionsAdded(true)
        }
        let temp = (rule as YamlStylingRule)
        if(temp.applyClass !== undefined || temp.applyShape !== undefined || temp.applyStyle !== undefined || temp.applyText !== undefined){
          setGeneralActionsAdded(true)
        }
    }

    useEffect(()=>{
        if(elements){
            setElementsAreLoading(true)
            setElementList(mapToSelectableValues(elements, ['all', 'nodes', 'subgraphs']))
            setElementsAreLoading(false)
        }
    }, [elements])


  useEffect(()=>{
    resetRule(rule)
    setIsLoading(false)
  }, [])

  const { containerProps, primaryProps, secondaryProps, splitterProps } = useSplitter({
    direction: 'row',
    initialSize: 0.2,
    dragPosition: 'start',
  });


  const mapToSelectableValues = (values: string[], addOptions?: string[]): SelectableValue[] => {
    let valueCopy: string[] = JSON.parse(JSON.stringify(values))
    if(addOptions){
        addOptions.reverse().forEach(option=>{
            valueCopy.unshift(option)
        })
    }
    return valueCopy.map(value => ({
      label: value,
      value: value
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onClose}
      title="Create New Rule"
      className={css`
        width: 900px;
        height: 825px;
        display: flex;
        flex-direction: column;
      `}
      trapFocus={false}
    >
      {isLoading ? (
        <div
          className={css`
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            width: 100%;
          `}
        >
          <LoadingPlaceholder text={"Loading..."}></LoadingPlaceholder>
        </div>
      ) : (
        <div
          {...containerProps}
          className={css`
            display: flex;
            flex-direction: row;
            width: 100%;
            height: 650px;
          `}
        >
          <div
            {...primaryProps}
            className={css`
              display: flex;
              wdith: 200px;
              flex-direction: column;
              overflow-y: auto;
            `}
          >
            <RuleCreateActionBar 
                forceUpdate={forceUpdate}
                saveStateToHistory={saveStateToHistory}
                newRuleRef={newRuleRef}
                setPriorityActionAdded={setPriorityActionAdded}
                setElementsActionAdded={setElementsActionAdded}
                setFunctionActionAdded={setFunctionActionAdded}
                setIfActionAdded={setIfActionAdded}
                setElseIfActionAdded={setElseIfActionAdded}
                setelseActionAdded={setelseActionAdded}
                setGeneralActionsAdded={setGeneralActionsAdded}
                resetRule={resetRule}
                handleUndo={handleUndo}
                rule={rule}
                generalActionsAdded={generalActionsAdded}
                elseActionAdded={elseActionAdded}
                priorityActionAdded={priorityActionAdded}
                elementsActionAdded={elementsActionAdded}
                functionActionAdded={functionActionAdded}
                ifActionAdded={ifActionAdded}
            />
          </div>
          <div {...splitterProps}></div>
          <div
            {...secondaryProps}
            className={css`
              display: flex;
              padding: 10px;
              flex-direction: column;
              overflow-y: auto;
              width: 450px;
              background-color: ${theme.colors.background.secondary};
              flex-grow: 1;  // Allow this div to grow and fill available space
              min-width: 0;  // Prevent children from expanding the div's width
            `}
          >
            <RuleInputWrapper isIcon={false}>
              <Text>Rule Type:</Text>
              <Select
                options={ruleTypeOptions}
                value={ruleType}
                onChange={handleRuleTypeChange}
                className="mb-2"
              />
            </RuleInputWrapper>
  
            <RuleInputWrapper isIcon={false}>
              <Text>Rule ID:</Text>
              <Input
                placeholder="Rule ID"
                value={newRuleRef.current.id}
                onChange={(e) => {
                  newRuleRef.current.id = e.currentTarget.value;
                  forceUpdate();
                }}
                className="mb-2"
              />
            </RuleInputWrapper>
  
            {priorityActionAdded && (
              <RuleInputWrapper
                onDelete={() => handleRuleInputDelete("priority")}
              >
                <Text>Priority:</Text>
                <Input
                  placeholder="Priority"
                  value={newRuleRef.current.priority}
                  type="number"
                  onChange={(e) => {
                    newRuleRef.current.priority = e.currentTarget.value;
                    forceUpdate();
                  }}
                  className="mb-2"
                />
              </RuleInputWrapper>
            )}
  
            {elementsActionAdded && !areElementsLoading && (
              <RuleInputWrapper
                onDelete={() => handleRuleInputDelete("elements")}
              >
                <Text>Elements</Text>
                <MultiSelect
                  label="Elements"
                  placeholder="Select Elements"
                  value={newRuleRef.current.elements}
                  options={ElementList}
                  onChange={(selected) => {
                    let tempList: string[] = [];
                    selected.forEach((value) => {
                      tempList.push(value.value);
                    });
                    newRuleRef.current.elements = tempList;
                    forceUpdate();
                  }}
                  className="mb-2"
                />
              </RuleInputWrapper>
            )}
  
            {generalActionsAdded && !functionActionAdded && 
            <RuleInputWrapper onDelete={handleGeneralRuleDelete}>
              <ActionInput
              action={getGeneralActions()}
              onChange={handleGeneralRuleChange}
              type={ruleType.value}>
              </ActionInput>
            </RuleInputWrapper>}
  
            {functionActionAdded && !generalActionsAdded && (
              <FunctionInput
                onLoaded={setIsFunctionLoaded}
                activeTab={activeTab}
                onActiveTabChange={setActiveTab}
                type={ruleType.value}
                functionData={newRuleRef.current.function}
                onFunctionChange={handleFunctionChange}
                forceUpdate={forceUpdate}
              />
            )}
          </div>
        </div>
      )}
      <Modal.ButtonRow>
        <Button variant={"secondary"} onClick={onClose}>Cancel</Button>
        {rule ? (
          <Button variant={"primary"}>Update</Button>
        ) : (
          <Button variant={"primary"}>Create</Button>
        )}
      </Modal.ButtonRow>
    </Modal>
  );
};
