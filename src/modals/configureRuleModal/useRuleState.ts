import { useState } from 'react';
import { SelectableValue } from '@grafana/data';

export interface RuleUIState {
  priorityActionAdded: boolean;
  elementsActionAdded: boolean;
  functionActionAdded: boolean;
  ifActionAdded: boolean;
  elseIfActionAdded: boolean;
  elseActionAdded: boolean;
  generalActionsAdded: boolean;
  ruleType: SelectableValue;
}

export function createEmptyRuleUIState(): RuleUIState {
  return {
    priorityActionAdded: false,
    elementsActionAdded: false,
    functionActionAdded: false,
    ifActionAdded: false,
    elseIfActionAdded: false,
    elseActionAdded: false,
    generalActionsAdded: false,
    ruleType: { 
      label: 'Binding Rule', 
      value: 'binding' 
    }
  };
}

export function useRuleUIState(initialState = createEmptyRuleUIState()) {
  const [uiState, setUIState] = useState<RuleUIState>(initialState);

  const updateUIState = (field: keyof RuleUIState, value: any) => {
    setUIState(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  const setPriorityActionAdded = (value: boolean) => updateUIState('priorityActionAdded', value);
  const setElementsActionAdded = (value: boolean) => updateUIState('elementsActionAdded', value);
  const setFunctionActionAdded = (value: boolean) => updateUIState('functionActionAdded', value);
  const setIfActionAdded = (value: boolean) => updateUIState('ifActionAdded', value);
  const setElseIfActionAdded = (value: boolean) => updateUIState('elseIfActionAdded', value);
  const setElseActionAdded = (value: boolean) => updateUIState('elseActionAdded', value);
  const setGeneralActionsAdded = (value: boolean) => updateUIState('generalActionsAdded', value);
  const setRuleType = (value: SelectableValue) => updateUIState('ruleType', value);

  const resetUIState = (newState = createEmptyRuleUIState()) => {
    setUIState(newState);
  };

  return {
    uiState,
    setUIState,
    resetUIState,

    priorityActionAdded: uiState.priorityActionAdded,
    elementsActionAdded: uiState.elementsActionAdded,
    functionActionAdded: uiState.functionActionAdded,
    ifActionAdded: uiState.ifActionAdded,
    elseIfActionAdded: uiState.elseIfActionAdded,
    elseActionAdded: uiState.elseActionAdded,
    generalActionsAdded: uiState.generalActionsAdded,
    ruleType: uiState.ruleType,

    setPriorityActionAdded,
    setElementsActionAdded,
    setFunctionActionAdded,
    setIfActionAdded,
    setElseIfActionAdded,
    setElseActionAdded,
    setGeneralActionsAdded,
    setRuleType
  };
}