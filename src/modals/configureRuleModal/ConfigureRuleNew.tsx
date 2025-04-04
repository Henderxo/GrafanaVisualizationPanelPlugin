import React, { useEffect } from 'react';
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
import { css } from '@emotion/css';
import RuleInputWrapper from 'components/wrappers/RuleInputWrapper';
import { FunctionInput } from 'components/inputs/FunctionInput';
import { ActionInput } from 'components/inputs/ActionInput';
import { RuleCreateActionBar } from 'components/inputs/RuleCreateActionBar';
import { getGeneralRuleActions } from 'utils/ActionUtils';
import { mapToSelectableValues } from 'utils/TransformationUtils';
import { YamlBindRule, YamlStylingRule, FlowClass } from '../../types';
import { RuleStateProvider, useRuleStateContext } from './ruleContext';


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

export const ConfigureRulenew: React.FC<ConfigureRuleModalProps> = (props) => {
  return (
    <RuleStateProvider 
      initialRule={props.rule}
      possibleClasses={props.possibleClasses}
      totalRuleCount={props.totalRuleCount}
      element={props.element}
      onSubmit={props.onSubmit}
    >
      <ConfigureRuleContent {...props} />
    </RuleStateProvider>
  );
};

// The inner component that uses the context
const ConfigureRuleContent: React.FC<ConfigureRuleModalProps> = ({ 
  isOpen,
  isEdit = false, 
  onClose, 
  onSubmit,
  elements,
  possibleClasses,
}) => {
  const { 
    // State
    newRuleRef,
    validationErrors,
    isLoading,
    areElementsLoading,
    activeTab,
    elementList,
    isConfirmModalOpen,
    
    // UI State
    priorityActionAdded,
    elementsActionAdded,
    functionActionAdded,
    ifActionAdded,
    generalActionsAdded,
    ruleType,
    
    // Methods
    forceUpdate,
    setIsLoading,
    setElementsAreLoading,
    setActiveTab,
    setElementList,
    setIsConfirmModalOpen,
    
    // Handlers
    saveStateToHistory,
    handleUndo,
    validateRule,
    handleRuleTypeChange,
    handleGeneralRuleChange,
    handleGeneralRuleDelete,
    handleFunctionChange,
    handleRuleInputDelete,
    resetRule,
    
    // UI State setters
    setPriorityActionAdded,
    setElementsActionAdded,
    setFunctionActionAdded,
    setIfActionAdded,
    setElseIfActionAdded,
    setElseActionAdded,
    setGeneralActionsAdded,
  } = useRuleStateContext();
  
  const theme = useTheme2();

  useEffect(() => {
    if (elements) {
      setElementsAreLoading(true);
      setElementList(mapToSelectableValues(elements, ['all', 'nodes', 'subgraphs']));
      setElementsAreLoading(false);
    }
  }, [elements]);

  useEffect(() => {
    resetRule()
    setIsLoading(false);
  }, []);

  const handleSubmit = () => {
    if (validateRule()) {
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
      onDismiss={() => setIsConfirmModalOpen(true)}
      title={`${isEdit ? 'Edit Rule' : 'Create New Rule'}`}
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
              setelseActionAdded={setElseActionAdded}
              setGeneralActionsAdded={setGeneralActionsAdded}
              resetRule={resetRule}
              handleUndo={handleUndo}
              generalActionsAdded={generalActionsAdded}
              elseActionAdded={false}
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
              flex-grow: 1;
              min-width: 0;
            `}
          >
            {!isEdit && <RuleInputWrapper isIcon={false}>
              <Text>Rule Type:</Text>
              <Field className={css`margin: 0px;`}>
                <Select
                  options={[
                    { label: 'Binding Rule', value: 'binding' },
                    { label: 'Styling Rule', value: 'styling' }
                  ]}
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
                    options={elementList}
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
                onLoaded={() => {}}
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
      <ConfirmModal 
        modalClass={css`top: 30%;`} 
        dismissText='Cancel' 
        confirmText='Confirm' 
        body={`Are you sure you want to cancel this object's ${!isEdit?'creation':'edit'}?`} 
        title={`Cancel ${!isEdit?'creation progress':'editing progress'}`} 
        isOpen={isConfirmModalOpen} 
        onDismiss={() => setIsConfirmModalOpen(false)} 
        onConfirm={() => {onClose(); setIsConfirmModalOpen(false)}}
      />
      <Modal.ButtonRow>
        <Button variant={"destructive"} onClick={() => setIsConfirmModalOpen(true)}>Cancel</Button>
        <Button onClick={handleSubmit} variant={"primary"}>
          {isEdit ? "Update" : "Create"}
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
};