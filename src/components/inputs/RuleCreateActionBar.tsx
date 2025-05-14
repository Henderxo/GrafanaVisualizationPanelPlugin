import React from "react"
import { 
    FunctionElement, 
    YamlBindRule, 
    YamlStylingRule 
} from '../../types'
import { Field, Icon, Text } from '@grafana/ui'
import { css } from '@emotion/css'
import ButtonWrapper from 'components/wrappers/ButtonWrapper'
import { useRuleStateContext } from "modals/configureRuleModal/ruleContext"

interface RuleCreateActionBarProps {}

export const RuleCreateActionBar: React.FC<RuleCreateActionBarProps> = () => {
    const 
    { 
        forceUpdate,
        saveStateToHistory,
        newRuleRef,
        setElementsActionAdded,
        setFunctionActionAdded,
        setIfActionAdded,
        setElseIfActionAdded,
        setElseActionAdded,
        setGeneralActionsAdded,
        handleRuleReset,
        handleUndo,
        elementsActionAdded,
        functionActionAdded,
        elseActionAdded,
        ifActionAdded,
        generalActionsAdded,
        validationErrors,

    } = useRuleStateContext()
    
    const createElseInput = () => {
        saveStateToHistory(newRuleRef.current.clone())
        if (
            !(newRuleRef.current.function as FunctionElement).else
        ) {
            newRuleRef.current.function = {
                ...(newRuleRef.current.function as FunctionElement),
                else: { action: {} },
            };
        }
        forceUpdate()
        setElseActionAdded(true);
    }

    const createActionInputs = () =>{
        validationErrors.action&&delete validationErrors.action
        saveStateToHistory(newRuleRef.current)
        setGeneralActionsAdded(true);
    }

    const createElseIfInput = () => {
        saveStateToHistory(newRuleRef.current)
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
    }

    const createIfInput = () => {
        validationErrors.action&&delete validationErrors.action
        saveStateToHistory(newRuleRef.current)
        newRuleRef.current = new (newRuleRef.current.constructor as
            | typeof YamlBindRule
            | typeof YamlStylingRule)({
            ...newRuleRef.current,
            function: { if: { action: {}, condition: "" } },
        });

        forceUpdate();
        setFunctionActionAdded(true)
        setIfActionAdded(true);
    }

    const createElementsInput = () => {
        saveStateToHistory(newRuleRef.current)
        newRuleRef.current = new (newRuleRef.current.constructor as
            | typeof YamlBindRule
            | typeof YamlStylingRule)({
            ...newRuleRef.current,
            elements: [],
        });
        forceUpdate();
        setElementsActionAdded(true);
    }

    return (
        <>
            <div
                className={css`
                    display: flex;
                    flex-direction: column;
                `}
            >
                <Text>Creation Actions:</Text>
                <ButtonWrapper onClick={() => handleRuleReset()}>
                    <Icon size={'lg'} name={'history-alt'} className={css`margin-right: 3px;`}></Icon><Text>Reset</Text>
                </ButtonWrapper>
                <ButtonWrapper onClick={() => handleUndo()}>
                    <Icon size={'lg'} name={'enter'} className={css`margin-right: 3px;`}></Icon><Text>Undo</Text>
                </ButtonWrapper>
            </div>
  
            {(!elementsActionAdded) && (
                <div
                    className={css`
                        display: flex;
                        flex-direction: column;
                    `}
                >
                    <Text>Scope Actions:</Text>
                    {!elementsActionAdded && (
                        <ButtonWrapper onClick={() => createElementsInput()}>
                            Add Elements
                        </ButtonWrapper>
                    )}
                </div>
            )}

            {!functionActionAdded && !generalActionsAdded && (
                <div>
                    <Field invalid={validationErrors.action?true:false} error={validationErrors.action}>
                        <div className={css`
                            display: flex;
                            flex-direction: column;`} >
                            <div>
                            <Text>Possible Actions:</Text>
                            </div>
                            <ButtonWrapper onClick={() => createActionInputs()}>   
                                Add Unconditional Action
                            </ButtonWrapper>
                            <ButtonWrapper onClick={() => createIfInput()}>   
                                Add Function
                            </ButtonWrapper>
                        </div>
                    </Field>
                    
                </div>   
            )}
            {functionActionAdded && (
                <div className={css`
                        display: flex;
                        flex-direction: column;
                    `}>
                    
                    <div>
                    <Text>Function Actions:</Text>
                    </div>
                    {ifActionAdded && (
                        <ButtonWrapper onClick={() => createElseIfInput()}>
                            Add Else If
                        </ButtonWrapper>
                    )}
                    {!elseActionAdded && ifActionAdded && (
                        <ButtonWrapper onClick={() => createElseInput()}>
                            Add Else
                        </ButtonWrapper>
                    )}
                    
                </div>
            )}
        </>
    );
}
