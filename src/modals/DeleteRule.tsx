import { css } from "@emotion/css";
import { useTheme2, Text, Badge, Divider } from "@grafana/ui";
import RuleInputWrapper from "components/RuleInputWrapper";
import React from "react";
import { YamlBindRule, YamlStylingRule } from "types/types";

interface DeleteRuleDisplayProps {
    rule: YamlBindRule | YamlStylingRule;
}

export const DeleteRuleDisplay: React.FC<DeleteRuleDisplayProps> = ({ rule }) => {
    const theme = useTheme2();

    const ruleType = rule instanceof YamlBindRule ? 'Binding Rule' : 'Styling Rule';

    return (
        <div className={css`
            padding: 16px;
            background: ${theme.colors.background.secondary};
            border-radius: 4px;
            margin-top: 16px;
            margin-bottom: 16px;
            max-height: 400px;
            overflow-y: auto;
        `}>
            <div className={css`display: flex; align-items: center; margin-bottom: 12px;`}>
                <Text element="h3" variant="h3">{rule.id}</Text>
                <Badge text={ruleType} color={rule instanceof YamlBindRule ? "blue" : "green"} className={css`margin-left: 12px;`} />
            </div>
            
            <Divider />
            
            <RuleInputWrapper isIcon={false}>
                <Text element="p" variant="body">Priority:</Text>
                <Text element="span"  variant="bodySmall">{rule.priority || 'default'}</Text>
            </RuleInputWrapper>
            
            {rule.elements && rule.elements.length > 0 && (
                <RuleInputWrapper isIcon={false}>
                    <Text element="p" variant="body">Elements:</Text>
                    {rule.elements.map((element, index) => (
                        <Badge key={index} color={rule instanceof YamlBindRule ? "blue" : "green"} text={element} className={css`margin-right: 4px;`}></Badge>
                    ))}
                </RuleInputWrapper>
            )}
            
        </div>
    );
};