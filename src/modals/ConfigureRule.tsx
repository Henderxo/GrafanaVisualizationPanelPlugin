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
  LoadingPlaceholder,
  Field,
  ConfirmModal
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { Action, FlowClass, FunctionElement, YamlBindRule, YamlStylingRule } from 'types/types';
import { css } from '@emotion/css';
import RuleInputWrapper from 'components/wrappers/RuleInputWrapper';
import { FunctionInput } from 'components/inputs/FunctionInput';
import { ActionInput } from 'components/inputs/ActionInput';
import { RuleCreateActionBar } from 'components/inputs/RuleCreateActionBar';
import { getGeneralRuleActions } from 'utils/ActionUtils';
import { mapToSelectableValues } from 'utils/TransformationUtils';


interface ConfigureRuleModalProps {
  isOpen: boolean;
  isEdit?: boolean;
  onClose: () => void;
  onSubmit: (rule: YamlBindRule | YamlStylingRule) => void;
  elements: string[],
  element?: string,
  possibleClasses: Map<string, FlowClass>,
  totalRuleCount?: number,
  rule?: YamlBindRule | YamlStylingRule
}

interface ValidationErrors {
  id?: string;
  priority?: string;
  elements?: string;
  generalActions?: string;
  function?: string;
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

export const ConfigureRule: React.FC<ConfigureRuleModalProps> = ({ 
  isOpen,
  isEdit = false, 
  onClose, 
  onSubmit,
  totalRuleCount,
  elements,
  possibleClasses,
  element,
  rule
}) => {
    //Errors
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
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
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false)
    const [isFunctionLoaded, setIsFunctionLoaded] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<'if' | 'else_if' | 'else'>('if');
    const  [ElementList, setElementList] = useState<SelectableValue[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [areElementsLoading, setElementsAreLoading] = useState<boolean>(false)
    const newRuleRef = useRef<YamlBindRule | YamlStylingRule>(new YamlBindRule({id: 'NewRule'}));
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const theme = useTheme2();

    const ruleTypeOptions: SelectableValue[] = [
      { label: 'Binding Rule', value: 'binding' },
      { label: 'Styling Rule', value: 'styling' }
    ];
    
    const [ruleType, setRuleType] = useState<SelectableValue>({
      label: 'Binding Rule', 
      value: 'binding'
    });

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

    const validateRule = (): boolean => {
      const errors: ValidationErrors = {};

      if (!newRuleRef.current.id || newRuleRef.current.id.trim() === '') {
        errors.id = 'Rule ID is required';
      }

      setValidationErrors(errors);

      return Object.keys(errors).length === 0;
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

    const handleFunctionChange = (updatedFunction: FunctionElement | undefined, deletedTab?: string) => {
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
        newRuleRef.current = element?new YamlBindRule({id: `${element}_Rule_${totalRuleCount}`, elements: [element]}):new YamlBindRule({id: `Rule_${totalRuleCount}`})
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

  const handleSubmit = () => {
    if(validateRule()){
      onSubmit(newRuleRef.current.clone());
      onClose();
    }
  };

  const { containerProps, primaryProps, secondaryProps, splitterProps } = useSplitter({
    direction: 'row',
    initialSize: 0.2,
    dragPosition: 'start',
  });



  return (
    <Modal
      isOpen={isOpen}
      onDismiss={()=>setIsConfirmModalOpen(true)}
      title={`${isEdit?'Edit Rule':'Create New Rule'}`}
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
              z-index: 1000;
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
            {!isEdit && <RuleInputWrapper isIcon={false}>
              <Text>Rule Type:</Text>
              <Field className={css`margin: 0px;`}>
                <Select
                options={ruleTypeOptions}
                value={ruleType}
                onChange={handleRuleTypeChange}
                className="mb-2"
                />
              </Field>
            </RuleInputWrapper>}
                  
            <RuleInputWrapper isIcon={false}>
              <Text>Rule ID:</Text>
              <Field invalid={newRuleRef.current.id==='' || validationErrors.id?true:false} className={css`margin: 0px;`} error={'Rule ID is required'}>
                <Input 
                placeholder="Rule ID"
                value={newRuleRef.current.id}
                onChange={(e) => {
                  newRuleRef.current.id = e.currentTarget.value;
                  forceUpdate();
                }}
                className="mb-2"
                />
              </Field>
            </RuleInputWrapper>
  
            {priorityActionAdded && (
              <RuleInputWrapper
                onDelete={() => handleRuleInputDelete("priority")}
              >
                <Text>Priority:</Text>
                <Field className={css`margin: 0px;`}>
                  <Input
                    placeholder="Priority"
                    value={newRuleRef.current.priority}
                    type="number"
                    onChange={(e) => {
                      newRuleRef.current.priority = parseInt(e.currentTarget.value)
                      forceUpdate();
                    }}
                    className="mb-2"
                  />
                </Field>
              </RuleInputWrapper>
            )}
  
            {elementsActionAdded && !areElementsLoading && (
              <RuleInputWrapper
                onDelete={() => handleRuleInputDelete("elements")}
              >
                <Text>Elements</Text>
                <Field className={css`margin: 0px;`}>
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
                </Field>
              </RuleInputWrapper>
            )}
  
            {generalActionsAdded && !functionActionAdded && 
            <RuleInputWrapper onDelete={handleGeneralRuleDelete}>
              <ActionInput
              possibleClasses={possibleClasses}
              action={getGeneralRuleActions(newRuleRef.current)}
              onChange={handleGeneralRuleChange}
              type={ruleType.value}>
              </ActionInput>
            </RuleInputWrapper>}
  
            {functionActionAdded && !generalActionsAdded && (
              <FunctionInput
                possibleClasses={possibleClasses}
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
      <ConfirmModal modalClass={css`top: 30%;`} dismissText='Cancel' confirmText='Confirm' body={`Are you sure you want to cancel this object's ${!isEdit?'creation':'edit'}?`} title={`Cancel ${!isEdit?'creation progress':'editing progress'}`} isOpen={isConfirmModalOpen} onDismiss={()=>setIsConfirmModalOpen(false)} onConfirm={()=>{onClose(); setIsConfirmModalOpen(false)}}></ConfirmModal>
      <Modal.ButtonRow>
        <Button variant={"destructive"} onClick={()=>setIsConfirmModalOpen(true)}>Cancel</Button>
        {rule ? (
          <Button onClick={handleSubmit} variant={"primary"}>Update</Button>
        ) : (
          <Button onClick={handleSubmit} variant={"primary"}>Create</Button>
        )}
      </Modal.ButtonRow>
    </Modal>
  );
};
