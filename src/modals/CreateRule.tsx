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
  Tab
} from '@grafana/ui';
import { Action, SelectableValue } from '@grafana/data';
import { FunctionElement, YamlBindRule, YamlStylingRule } from 'types/types';
import { css } from '@emotion/css';
import { parse } from 'path';
import RuleInputWrapper from 'components/RuleInputWrapper';
import { FunctionInput } from 'components/FunctionInput';


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
    //Actions
    const [priorityActionAdded, setPriorityActionAdded] = useState<boolean>(false);
    const [elementsActionAdded, setElementsActionAdded] = useState<boolean>(false);
    const [functionActionAdded, setFunctionActionAdded] = useState<boolean>(false);
    const [ifActionAdded, setIfActionAdded] = useState<boolean>(false);
    const [elseIfActionAdded, setElseIfActionAdded] = useState<boolean>(false);
    const [elseActionAdded, setelseActionAdded] = useState<boolean>(false);
    //Action
    const  [ElementList, setElementList] = useState<SelectableValue[]>([])
    const newRuleRef = useRef<YamlBindRule | YamlStylingRule>({id: ''});
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const theme = useTheme2();

    const handleFunctionChange = (updatedFunction: string | FunctionElement) => {
        newRuleRef.current.function = updatedFunction;
      };

    useEffect(()=>{
        if(elements){
            console.log(elements)
            setElementList(mapToSelectableValues(elements, ['all', 'nodes', 'subgraphs']))
        }
    }, [elements])


  useEffect(()=>{

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
        forceUpdate()
    }

  }, [rule])

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
                height: 700px;
                display: flex;
                flex-direction: column;
              `}
        trapFocus={false}>
            <div {...containerProps} className={css` display: flex; flex-direction: row; width: 100%; height: 500px;`}>
                <div  {...primaryProps} className={css`display: flex; flex-direction: column; width: 125px; overflow-y: auto;`}>
                {!priorityActionAdded &&
                <Button className={css`margin-top: 4px; margin-bottom: 4px;`} onClick={()=>{setPriorityActionAdded(true)}}>Add Priority</Button>
                }
                {!elementsActionAdded &&
                <Button className={css`margin-top: 4px; margin-bottom: 4px;`} onClick={()=>{setElementsActionAdded(true)}}>Add Elements</Button>
                }
                {!functionActionAdded &&
                <Button className={css`margin-top: 4px; margin-bottom: 4px;`} onClick={()=>{setFunctionActionAdded(true)}}>Add Function</Button>
                }
                {(!ifActionAdded && functionActionAdded) &&
                <Button className={css`margin-top: 4px; margin-bottom: 4px;`} onClick={()=>
                    {
                        newRuleRef.current = {
                            ...newRuleRef.current,
                            function: {if: {action: {}, condition: ''}} // Ensure else_if exists before pushing
                        };
                        forceUpdate()
                        setIfActionAdded(true)
                    }}>Add If</Button>
                }
                {(functionActionAdded && ifActionAdded) &&
                <Button className={css`margin-top: 4px; margin-bottom: 4px;`} onClick={()=>{
                    if(!(newRuleRef.current.function as FunctionElement).else_if){
                        newRuleRef.current.function = {
                            ...newRuleRef.current.function as FunctionElement,
                            else_if: [{action: {}, condition: ''}] 
                          };
                    }else{
                        (newRuleRef.current.function as FunctionElement).else_if?.push({action: {}, condition: ''})
                    }
                    forceUpdate()
                    setElseIfActionAdded(true)
                }}>Add Else If</Button>
                }
                {(!elseActionAdded && functionActionAdded && ifActionAdded) &&
                <Button className={css`margin-top: 4px; margin-bottom: 4px;`} onClick={()=>
                    {
                        if(!(newRuleRef.current.function as FunctionElement).else){
                            newRuleRef.current.function = {
                                ...newRuleRef.current.function as FunctionElement,
                                else: {action: {}}
                              };
                        }
                        setelseActionAdded(true)
                    }}>Add Else</Button>
                }
                </div>
                <div {...splitterProps}></div>
                <div {...secondaryProps} className={css`display: flex; padding: 10px; flex-direction: column; overflow-y: auto; background-color: ${theme.colors.background.secondary}`}>

                <RuleInputWrapper>
                    <Text>Rule ID:</Text>
                    <Input
                        placeholder="Rule ID" 
                        value={newRuleRef.current.id} 
                        onChange={(e) => {
                            newRuleRef.current.id = e.currentTarget.value
                            forceUpdate();
                        }}
                        className="mb-2"
                    />
                </RuleInputWrapper>

                {priorityActionAdded && 
                    <RuleInputWrapper>
                        <Text>Priority:</Text>
                        <Input 
                        placeholder="Priority" 
                        value={newRuleRef.current.priority} 
                        type='number'
                        onChange={(e) => {
                            newRuleRef.current.priority = e.currentTarget.value
                            forceUpdate();
                        }}
                        className="mb-2"/>
                    </RuleInputWrapper>    
                }

                {elementsActionAdded &&
                    <RuleInputWrapper>
                        <Text>Elements</Text>
                        <MultiSelect 
                        label='Elements'
                        placeholder="Select Elements"
                        value={newRuleRef.current.elements}
                        options={ElementList}
                        onChange={(selected) => {
                            let tempList: string[]=[]
                            selected.forEach(value =>
                            { 
                                tempList.push(value.value)
                            })
                            newRuleRef.current.elements = tempList
                            forceUpdate();
                        }}
                        className="mb-2"
                        />
                    </RuleInputWrapper>
                }

                {functionActionAdded &&

                <FunctionInput 
                functionData={newRuleRef.current.function}
                onFunctionChange={handleFunctionChange}
                forceUpdate={forceUpdate}
                />
                }

            </div>
        </div>
     
    </Modal>
  );
};
