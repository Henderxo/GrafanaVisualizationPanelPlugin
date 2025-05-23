import React, { createContext, useContext, useRef } from 'react';
import { SelectableValue } from '@grafana/data';
import { Action, FlowClass, FunctionElement, YamlBindRule, YamlStylingRule } from '../../types';
import { RuleUIState, useRuleUIState } from 'modals/configureRuleModal/useRuleState';
import { validateRuleBase, ValidationResult } from 'utils/ValidationUtils';
import { createRecordFromObjects } from 'utils/TransformationUtils';

interface RuleStateContextType {

  newRuleRef: React.MutableRefObject<YamlBindRule | YamlStylingRule>;
  stateHistory: { rule: YamlBindRule | YamlStylingRule, uiState: RuleUIState }[];
  validationErrors: Record<string, string>;
  isLoading: boolean;
  areElementsLoading: boolean;
  activeTab: 'if' | 'else_if' | 'else';
  elementList: SelectableValue[];
  isConfirmModalOpen: boolean;
  

  uiState: RuleUIState;
  priorityActionAdded: boolean;
  elementsActionAdded: boolean;
  functionActionAdded: boolean;
  ifActionAdded: boolean;
  elseIfActionAdded: boolean;
  elseActionAdded: boolean;
  generalActionsAdded: boolean;
  ruleType: SelectableValue;
  
  forceUpdate: () => void;
  setStateHistory: React.Dispatch<React.SetStateAction<{ rule: YamlBindRule | YamlStylingRule, uiState: RuleUIState }[]>>;
  setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setElementsAreLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab: React.Dispatch<React.SetStateAction<'if' | 'else_if' | 'else'>>;
  setElementList: React.Dispatch<React.SetStateAction<SelectableValue[]>>;
  setIsConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  setUIState: (state: RuleUIState) => void;
  resetUIState: (newState?: RuleUIState) => void;
  setPriorityActionAdded: (value: boolean) => void;
  setElementsActionAdded: (value: boolean) => void;
  setFunctionActionAdded: (value: boolean) => void;
  setIfActionAdded: (value: boolean) => void;
  setElseIfActionAdded: (value: boolean) => void;
  setElseActionAdded: (value: boolean) => void;
  setGeneralActionsAdded: (value: boolean) => void;
  setRuleType: (value: SelectableValue) => void;
  
  saveStateToHistory: (state?: YamlBindRule | YamlStylingRule) => void;
  handleUndo: () => void;
  handleRuleReset: () => void
  validateRule: () => boolean;
  handleRuleTypeChange: (selectedType: SelectableValue) => void;
  handleGeneralRuleChange: (action: Action) => void;
  handleGeneralRuleDelete: () => void;
  handleFunctionChange: (updatedFunction: FunctionElement | undefined, deletedTab?: string) => void;
  handleRuleInputDelete: (type: 'elements') => void;
  resetRule: (rule?: YamlBindRule | YamlStylingRule) => void;
  reconfigureEditor: (rule: YamlBindRule | YamlStylingRule) => void;
}

const RuleStateContext = createContext<RuleStateContextType | undefined>(undefined);

interface RuleStateProviderProps {
  children: React.ReactNode;
  initialRule?: YamlBindRule | YamlStylingRule;
  possibleClasses: Map<string, FlowClass>;
  totalRuleCount?: number;
  element?: string;
  onSubmit: (rule: YamlBindRule | YamlStylingRule) => void;
}

export const RuleStateProvider: React.FC<RuleStateProviderProps> = ({ 
  children, 
  initialRule,
  totalRuleCount,
  element
}) => {

  const [stateHistory, setStateHistory] = React.useState<{
    rule: YamlBindRule | YamlStylingRule,
    uiState: RuleUIState
  }[]>([]);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [areElementsLoading, setElementsAreLoading] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<'if' | 'else_if' | 'else'>('if');
  const [elementList, setElementList] = React.useState<SelectableValue[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState<boolean>(false);
  
  const newRuleRef = useRef<YamlBindRule | YamlStylingRule>(
    initialRule || 
    (element 
      ? new YamlBindRule({name: `${element}_Rule_${totalRuleCount}`, elements: [element]})
      : new YamlBindRule({name: `Rule_${totalRuleCount}`})
    )
  );
  
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  const ruleUIState = useRuleUIState();
  
  const maxHistoryLength = 10;
  
  const ruleTypeOptions: SelectableValue[] = [
    { label: 'Binding Rule', value: 'binding' },
    { label: 'Styling Rule', value: 'styling' }
  ];

  const saveStateToHistory = (state?: YamlBindRule | YamlStylingRule) => {
    setStateHistory(prevHistory => {
      const clonedState = state ? state.clone() : newRuleRef.current.clone()
      
      const newHistory = [
        ...prevHistory, 
        { 
          rule: clonedState, 
          uiState: {...ruleUIState.uiState} 
        }
      ];
      return newHistory.slice(-maxHistoryLength);
    });
  };

  const handleUndo = () => {
    if (stateHistory.length > 0) {
      const previousState = stateHistory[stateHistory.length - 1];
      
      resetRule(previousState.rule);

      ruleUIState.resetUIState();
      ruleUIState.setUIState(previousState.uiState);

      setStateHistory(prevHistory => prevHistory.slice(0, -1));
    }
  };

  const handleRuleReset = () =>{
    saveStateToHistory(newRuleRef.current)
    resetRule()
  }

  const validateRule = (): boolean => {

    const validationResult: ValidationResult = validateRuleBase(newRuleRef.current, {collectAllErrors: true})

    if(!validationResult.isValid){
      const errorRecord = createRecordFromObjects(validationResult.errors, 'field', 'message')
      setValidationErrors(errorRecord);
    }

    return validationResult.isValid;
  };

  const handleRuleTypeChange = (selectedType: SelectableValue) => {
    handleFunctionChange(undefined);
    newRuleRef.current = selectedType.value === 'binding' 
      ? new YamlBindRule({...newRuleRef.current, name: newRuleRef.current.name})
      : new YamlStylingRule({...newRuleRef.current, name: newRuleRef.current.name});
    resetRule(newRuleRef.current);
  };

  const handleGeneralRuleChange = (action: Action) => {
    saveStateToHistory(newRuleRef.current);
    const currentRule = newRuleRef.current.clone();
  
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
  };

  const handleGeneralRuleDelete = () => {
    saveStateToHistory(newRuleRef.current);
    const currentRule = newRuleRef.current.clone();

    if (currentRule.getRuleType() === 'binding') {
      const bindRule = currentRule as YamlBindRule;
      bindRule.bindData = undefined;
      
      newRuleRef.current = bindRule;
    } else if (currentRule.getRuleType() === 'styling') {
      const stylingRule = currentRule as YamlStylingRule;
      
      stylingRule.applyClass = undefined;
      stylingRule.applyText = undefined;
      stylingRule.applyStyle = undefined;
      stylingRule.applyShape = undefined;
      
      newRuleRef.current = stylingRule;
    }
    ruleUIState.setGeneralActionsAdded(false);
    forceUpdate();
  };

  const handleFunctionChange = (updatedFunction: FunctionElement | undefined, deletedTab?: string) => {
    updatedFunction&&saveStateToHistory(newRuleRef.current.clone());
    if (updatedFunction) {
      newRuleRef.current.function = updatedFunction;
      if (deletedTab) {
        if (deletedTab === 'else_if') {
          ruleUIState.setElseIfActionAdded(false);
          setActiveTab('if');
        } else {
          ruleUIState.setElseActionAdded(false);
          setActiveTab('if');
        }
      }
    } else {
      delete newRuleRef.current.function;
      ruleUIState.setIfActionAdded(false);
      ruleUIState.setFunctionActionAdded(false);
      ruleUIState.setElseIfActionAdded(false);
      ruleUIState.setElseActionAdded(false);
    }
    forceUpdate();
  };

  const handleRuleInputDelete = (type: 'elements') => {
    if (newRuleRef.current) {
      saveStateToHistory(newRuleRef.current);
      switch (type) {
        case 'elements':
          if (newRuleRef.current.elements) {
            delete newRuleRef.current.elements;
            ruleUIState.setElementsActionAdded(false);
            forceUpdate();
          }
          break;
      }
    }
  };

  const reconfigureEditor = (rule: YamlBindRule | YamlStylingRule) => {
    ruleUIState.resetUIState()
    ruleUIState.setRuleType(ruleTypeOptions.find(obj => obj.value === rule.getRuleType()) ?? { label: 'Binding Rule', value: 'binding' });
    rule.elements && ruleUIState.setElementsActionAdded(true);

    if (rule.function) {
      ruleUIState.setFunctionActionAdded(true);
      if (typeof rule.function !== 'string') {
        ruleUIState.setIfActionAdded(true);
        if (rule.function.else_if) {
          ruleUIState.setElseIfActionAdded(true);
        } else if (activeTab === 'else_if') {
          setActiveTab('if');
        }
        if (rule.function.else) {
          ruleUIState.setElseActionAdded(true);
        } else if (activeTab === 'else') {
          if (rule.function.else_if) {
            setActiveTab('else_if');
          } else {
            setActiveTab('if');
          }
        }
      }
    }
    
    if ((rule as YamlBindRule).bindData !== undefined) {
      ruleUIState.setGeneralActionsAdded(true);
    }
    
    let temp = (rule as YamlStylingRule);
    if (temp.applyClass !== undefined || temp.applyShape !== undefined || 
        temp.applyStyle !== undefined || temp.applyText !== undefined) {
      ruleUIState.setGeneralActionsAdded(true);
    }
  };

  const resetRule = (rule?: YamlBindRule | YamlStylingRule) => {
    let tempRule = rule??initialRule
    if (tempRule) {
      newRuleRef.current = tempRule.clone();
      reconfigureEditor(tempRule);
    } else {
      newRuleRef.current = element 
        ? new YamlBindRule({name: `${element}_Rule_${totalRuleCount}`, elements: [element]})
        : new YamlBindRule({name: `Rule_${totalRuleCount}`});
      reconfigureEditor(newRuleRef.current);
    }
    forceUpdate();
    setIsLoading(false);
  };

  const value: RuleStateContextType = {
    newRuleRef,
    stateHistory,
    validationErrors,
    isLoading,
    areElementsLoading,
    activeTab,
    elementList,
    isConfirmModalOpen,
    
    ...ruleUIState,
    
    forceUpdate,
    setStateHistory,
    setValidationErrors,
    setIsLoading,
    setElementsAreLoading,
    setActiveTab,
    setElementList,
    setIsConfirmModalOpen,
    
    saveStateToHistory,
    handleRuleReset,
    handleUndo,
    validateRule,
    handleRuleTypeChange,
    handleGeneralRuleChange,
    handleGeneralRuleDelete,
    handleFunctionChange,
    handleRuleInputDelete,
    resetRule,
    reconfigureEditor,
  };

  return (
    <RuleStateContext.Provider value={value}>
      {children}
    </RuleStateContext.Provider>
  );
};

export const useRuleStateContext = () => {
  const context = useContext(RuleStateContext);
  if (context === undefined) {
    throw new Error('useRuleStateContext must be used within a RuleStateProvider');
  }
  return context;
};