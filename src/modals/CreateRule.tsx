import React, { useEffect, useRef, useState } from 'react';
import { 
  Modal, 
  ModalHeader,  
  Button, 
  Select, 
  Input, 
  TextArea,
  Checkbox,
  RadioButtonGroup,
  useSplitter,
  IconButton,
  MultiSelect,
  Label,
  Text,
  Box,
  useTheme2,
  TabsBar,
  Tab,
  LoadingPlaceholder
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { Action, FunctionElement, RuleBase, YamlBindRule, YamlStylingRule } from 'types/types';
import { css } from '@emotion/css';
import { parse } from 'path';
import RuleInputWrapper from 'components/RuleInputWrapper';
import { FunctionInput } from 'components/FunctionInput';
import ButtonWrapper from 'components/ButtonWrapper';
import { ActionInput } from 'components/ActionInput';
import { bindData } from 'utils/DataBindingUtils';


interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rule: YamlBindRule | YamlStylingRule) => void;
  elements: string[],
  rule?: YamlBindRule | YamlStylingRule
}

export const CreateRuleModal: React.FC<CreateRuleModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  elements,
  rule
}) => {
    //History
    const [stateHistory, setStateHistory] = useState<(YamlBindRule | YamlStylingRule)[]>([]);
    const maxHistoryLength = 10;
    //Actions
    const [priorityActionAdded, setPriorityActionAdded] = useState<boolean>(false);
    const [elementsActionAdded, setElementsActionAdded] = useState<boolean>(false);
    const [functionActionAdded, setFunctionActionAdded] = useState<boolean>(false);
    const [ifActionAdded, setIfActionAdded] = useState<boolean>(false);
    const [elseIfActionAdded, setElseIfActionAdded] = useState<boolean>(false);
    const [elseActionAdded, setelseActionAdded] = useState<boolean>(false);
    const [generalActionsAdded, setGeneralActionsAdded] = useState<boolean>(false);
    //Action
    const  [ElementList, setElementList] = useState<SelectableValue[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [areElementsLoading, setElementsAreLoading] = useState<boolean>(false)
    const newRuleRef = useRef<YamlBindRule | YamlStylingRule>(new YamlBindRule({id: ''}));
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const theme = useTheme2();

    const saveStateToHistory = (state: YamlBindRule | YamlStylingRule) => {
      setStateHistory(prevHistory => {
        const newHistory = [...prevHistory, JSON.parse(JSON.stringify(state))];
        return newHistory.slice(-maxHistoryLength);
      });
    };

    const handleUndo = () => {
      console.log(stateHistory)
      if (stateHistory.length > 0) {
        const previousState = stateHistory[stateHistory.length - 1];
        
        resetRule(previousState);
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
      saveStateToHistory(newRuleRef.current);
      setRuleType(selectedType);
    
      newRuleRef.current = selectedType.value === 'binding' 
        ? new YamlBindRule({...newRuleRef.current, id: newRuleRef.current.id})
        : new YamlStylingRule({...newRuleRef.current, id: newRuleRef.current.id});
      newRuleRef.current.function = undefined
      handleFunctionChange(newRuleRef.current.function)

      resetRule(newRuleRef.current)
    };

    const handleFunctionChange = (updatedFunction: string | FunctionElement | undefined, deletedTab?: string) => {
      saveStateToHistory(newRuleRef.current);
      if(updatedFunction){
        newRuleRef.current.function = updatedFunction;
        if(deletedTab){
          if(deletedTab === 'else_if'){
            setElseIfActionAdded(false)
          }else{
            setelseActionAdded(false)
          }
        }
      }else{
        delete newRuleRef.current.function
        setIfActionAdded(false)
        setFunctionActionAdded(false)
        setElseIfActionAdded(false)
        setelseActionAdded(false)
      }
      console.log(newRuleRef.current)
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
      console.log(rule)
      setPriorityActionAdded(false)
      setElementsActionAdded(false)
      setFunctionActionAdded(false)
      setIfActionAdded(false)
      setelseActionAdded(false)
      if(rule){
        newRuleRef.current = JSON.parse(JSON.stringify(rule));
        newRuleRef.current.priority && setPriorityActionAdded(true);
        newRuleRef.current.elements && setElementsActionAdded(true);

        if(newRuleRef.current.function){
            setFunctionActionAdded(true);
            if(typeof newRuleRef.current.function !== 'string'){
              setIfActionAdded(true);
              if(newRuleRef.current.function.else_if){
                setElseIfActionAdded(true);
              }
              if(newRuleRef.current.function.else){
                setelseActionAdded(true);
              }
            }
          }
      }else{
        newRuleRef.current = new YamlBindRule({id: ''})
      }
      forceUpdate()
      setIsLoading(false)
    }

    useEffect(()=>{
        if(elements){
            setElementsAreLoading(true)
            setElementList(mapToSelectableValues(elements, ['all', 'nodes', 'subgraphs']))
            setElementsAreLoading(false)
        }
    }, [elements])


  useEffect(()=>{
    console.log(rule)
    resetRule(rule)
    setIsLoading(false)
  }, [])

  const { containerProps, primaryProps, secondaryProps, splitterProps } = useSplitter({
    direction: 'row',
    initialSize: 0.1,
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
              flex-direction: column;
              width: 125px;
              overflow-y: auto;
            `}
          >
            <div
              className={css`
                display: flex;
                flex-direction: column;
              `}
            >
              <Text>Creation Actions:</Text>
              <ButtonWrapper onClick={() => resetRule(rule)}>Reset</ButtonWrapper>
              <ButtonWrapper onClick={()=> handleUndo()}>Undo</ButtonWrapper>
            </div>
  
            {(!priorityActionAdded || !elementsActionAdded) && (
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                `}
              >
                <Text>Scope Actions:</Text>
                {!priorityActionAdded && (
                  <ButtonWrapper
                    onClick={() => {
                      newRuleRef.current = new (newRuleRef.current.constructor as
                        | typeof YamlBindRule
                        | typeof YamlStylingRule)({
                        ...newRuleRef.current,
                        priority: -1,
                      });
                      forceUpdate();
                      setPriorityActionAdded(true);
                    }}
                  >
                    Add Priority
                  </ButtonWrapper>
                )}
                {!elementsActionAdded && (
                  <ButtonWrapper
                    onClick={() => {
                      newRuleRef.current = new (newRuleRef.current.constructor as
                        | typeof YamlBindRule
                        | typeof YamlStylingRule)({
                        ...newRuleRef.current,
                        elements: [],
                      });
                      forceUpdate();
                      setElementsActionAdded(true);
                    }}
                  >
                    Add Elements
                  </ButtonWrapper>
                )}
              </div>
            )}
            <div>
              <Text>Function Actions:</Text>
            </div>
            {!functionActionAdded && (
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                `}
              >
                <ButtonWrapper
                  onClick={() => {
                    setFunctionActionAdded(true);
                  }}
                >
                  Add Function
                </ButtonWrapper>
              </div>
            )}
            {functionActionAdded && (
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                `}
              >
                {!ifActionAdded && functionActionAdded && (
                  <ButtonWrapper
                    onClick={() => {
                      newRuleRef.current = new (newRuleRef.current.constructor as
                        | typeof YamlBindRule
                        | typeof YamlStylingRule)({
                        ...newRuleRef.current,
                        function: { if: { action: {}, condition: "" } },
                      });
                      console.log(newRuleRef.current);
                      forceUpdate();
                      setIfActionAdded(true);
                    }}
                  >
                    Add If
                  </ButtonWrapper>
                )}
                {ifActionAdded && (
                  <ButtonWrapper
                    onClick={() => {
                      if (
                        !(newRuleRef.current.function as FunctionElement).else_if
                      ) {
                        newRuleRef.current.function = {
                          ...(newRuleRef.current.function as FunctionElement),
                          else_if: [{ action: {}, condition: "" }],
                        };
                      } else {
                        (
                          newRuleRef.current.function as FunctionElement
                        ).else_if?.push({ action: {}, condition: "" });
                      }
                      forceUpdate();
                      setElseIfActionAdded(true);
                    }}
                  >
                    Add Else If
                  </ButtonWrapper>
                )}
                {!elseActionAdded && ifActionAdded && (
                  <ButtonWrapper
                    onClick={() => {
                      if (
                        !(newRuleRef.current.function as FunctionElement).else
                      ) {
                        newRuleRef.current.function = {
                          ...(newRuleRef.current.function as FunctionElement),
                          else: { action: {} },
                        };
                      }
                      setelseActionAdded(true);
                    }}
                  >
                    Add Else
                  </ButtonWrapper>
                )}
              </div>
            )}
          </div>
          <div {...splitterProps}></div>
          <div
            {...secondaryProps}
            className={css`
              display: flex;
              padding: 10px;
              flex-direction: column;
              overflow-y: auto;
              background-color: ${theme.colors.background.secondary};
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
  
            <ActionInput
              action={getGeneralActions()}
              onChange={() => {}}
              type={ruleType.value}
            ></ActionInput>
  
            {functionActionAdded && (
              <FunctionInput
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
        <Button variant={"secondary"}>Cancel</Button>
        {rule ? (
          <Button variant={"primary"}>Update</Button>
        ) : (
          <Button variant={"primary"}>Create</Button>
        )}
      </Modal.ButtonRow>
    </Modal>
  );
};
