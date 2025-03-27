import React from "react"
import { 
    FunctionElement, 
    YamlBindRule, 
    YamlStylingRule 
} from "types/types"
import { Text } from '@grafana/ui'
import { css } from '@emotion/css'
import ButtonWrapper from 'components/ButtonWrapper'

interface RuleCreateActionBarProps {
    forceUpdate: () => void
    saveStateToHistory: (state: YamlBindRule | YamlStylingRule) => void
    newRuleRef: React.MutableRefObject<YamlBindRule | YamlStylingRule>
    setPriorityActionAdded: (added: boolean) => void
    setElementsActionAdded: (added: boolean) => void
    setFunctionActionAdded: (added: boolean) => void
    setIfActionAdded: (added: boolean) => void
    setElseIfActionAdded: (added: boolean) => void
    setelseActionAdded: (added: boolean) => void
    setGeneralActionsAdded: (added: boolean) => void
    resetRule: (rule?: YamlBindRule | YamlStylingRule) => void
    handleUndo: () => void
    rule?: YamlBindRule | YamlStylingRule
    priorityActionAdded: boolean
    elementsActionAdded: boolean
    functionActionAdded: boolean
    ifActionAdded: boolean
    elseActionAdded: boolean
    generalActionsAdded: boolean
}

export const RuleCreateActionBar: React.FC<RuleCreateActionBarProps> = ({ 
    forceUpdate,
    saveStateToHistory,
    newRuleRef,
    setPriorityActionAdded,
    setElementsActionAdded,
    setFunctionActionAdded,
    setIfActionAdded,
    setElseIfActionAdded,
    setelseActionAdded,
    setGeneralActionsAdded,
    resetRule,
    handleUndo,
    rule,
    priorityActionAdded,
    elementsActionAdded,
    functionActionAdded,
    elseActionAdded,
    ifActionAdded,
    generalActionsAdded
}) => {
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
        setelseActionAdded(true);
    }

    const createActionInputs = () =>{
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
        saveStateToHistory(newRuleRef.current)
        newRuleRef.current = new (newRuleRef.current.constructor as
            | typeof YamlBindRule
            | typeof YamlStylingRule)({
            ...newRuleRef.current,
            function: { if: { action: {}, condition: "" } },
        });

        forceUpdate();
        setIfActionAdded(true);
    }

    const createPriorityInput = () => {
        saveStateToHistory(newRuleRef.current)
        newRuleRef.current = new (newRuleRef.current.constructor as
            | typeof YamlBindRule
            | typeof YamlStylingRule)({
            ...newRuleRef.current,
            priority: -1,
        });
        forceUpdate();
        setPriorityActionAdded(true);
    }

    const createFunctionInput = () => {
        console.log(newRuleRef.current)
        saveStateToHistory(newRuleRef.current)
        newRuleRef.current = new (newRuleRef.current.constructor as
            | typeof YamlBindRule
            | typeof YamlStylingRule)({
            ...newRuleRef.current,
            function: '',
        });
        console.log(newRuleRef.current)
        forceUpdate();
        setFunctionActionAdded(true);
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
                <ButtonWrapper onClick={() => resetRule(rule)}>Reset</ButtonWrapper>
                <ButtonWrapper onClick={() => handleUndo()}>Undo</ButtonWrapper>
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
                        <ButtonWrapper onClick={() => createPriorityInput()}>
                            Add Priority
                        </ButtonWrapper>
                    )}
                    {!elementsActionAdded && (
                        <ButtonWrapper onClick={() => createElementsInput()}>
                            Add Elements
                        </ButtonWrapper>
                    )}
                </div>
            )}

            {!functionActionAdded && !generalActionsAdded && (
                <div 
                className={css`
                    display: flex;
                    flex-direction: column;`} >
                    <div>
                        <Text>Possible Actions:</Text>
                    </div>
                    <ButtonWrapper onClick={() => createActionInputs()}>   
                        Add General Action
                    </ButtonWrapper>
                    <ButtonWrapper onClick={() => createFunctionInput()}>   
                        Add Function
                    </ButtonWrapper>
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
                    {!ifActionAdded && functionActionAdded && (
                        <ButtonWrapper onClick={() => createIfInput()}>
                            Add If
                        </ButtonWrapper>
                    )}
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