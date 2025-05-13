import React, {  useState } from "react";
import {  customHtmlBase, FlowClass, FunctionElement, YamlBindRule, YamlStylingRule } from '../types';
import StringList from "./StringListDisplay";
import { useTheme2, Text, Divider, PageToolbar, ToolbarButton, ConfirmModal } from '@grafana/ui';
import FunctionList from "./FunctionDisplay";
import { css } from '@emotion/css';
import RuleInputWrapper from "components/wrappers/RuleInputWrapper";
import { ActionsDisplay } from "./ActionsDisplay";
import { ConfigureRulenew } from "modals/configureRuleModal/ConfigureRuleNew";

interface RuleDisplayProps extends customHtmlBase {
  rule: YamlBindRule | YamlStylingRule;
  height?: string;
  elements: string[]
  possibleClasses: Map<string, FlowClass>
  onEditSubmit: (rule: YamlBindRule | YamlStylingRule, oldRule: YamlBindRule | YamlStylingRule) => void;
  onDelete: (rule: YamlBindRule | YamlStylingRule) => void
}

export const RuleDisplay: React.FC<RuleDisplayProps> = ({ 
  hover = false, 
  rule, 
  height = '100%', 
  textSize = 'span', 
  elements,
  labelSize = 'span',
  possibleClasses,
  onEditSubmit,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const theme = useTheme2();
  
  const bgHoverColor = theme.colors.border.medium;
  const bgColor = theme.colors.background.secondary;

  return (
    <div
      className={css`
        height: ${height};
        padding: 17px;
        background: ${isHovered ? bgHoverColor : bgColor};
        transition: background-color 0.3s ease;
        max-height: calc(100% - 5px);
        display: flex;
        flex-direction: column;
        overflow-y: auto;
      `}
      onMouseEnter={() => setIsHovered(hover)} 
      onMouseLeave={() => setIsHovered(false)} 
    >
      {isEditModalOpen && <ConfigureRulenew
      isEdit={true} 
      possibleClasses={possibleClasses}
      rule={rule}
      elements={elements}
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      onSubmit={(newRule) =>onEditSubmit(newRule, rule)}/>}
      <ConfirmModal 
        modalClass={css`top: 30%;`}
        isOpen={isDeleteModalOpen} 
        title={`Delete Rule: ${rule.name}`} 
        body={
          <div>
            <Text element="p">Are you sure you want to delete this rule?</Text>
            <Text color="error" element="span">Rule will be deleted and removed from all elements associated with it!</Text>
          </div>
        } 
        confirmText="Delete" 
        confirmButtonVariant="destructive" 
        dismissText="Cancel" 
        onConfirm={() => {onDelete(rule); setIsDeleteModalOpen(false);}} 
        onDismiss={() => setIsDeleteModalOpen(false)}
      />
     <PageToolbar className={css`background: ${isHovered ? bgHoverColor : bgColor}; padding: 1px; padding-top: 3px; padding-bottom: 3px;`} title={`${rule.name}`} >
      <ToolbarButton onClick={()=>setIsEditModalOpen(true)} iconSize="lg" className={css`&:hover{ background-color: ${theme.colors.background.primary}}`} icon="edit">Edit</ToolbarButton>
      <ToolbarButton onClick={()=>setIsDeleteModalOpen(true)} iconSize="lg" className={css`&:hover{ background-color: ${theme.colors.background.primary}}`} icon="trash-alt"></ToolbarButton>
     </PageToolbar>
      <Divider/>
      <div className={css`flex: 1;`}>
        <RuleInputWrapper isIcon={false}><div className={css`margin-top: 4px; margin-bottom: 8px;`}>
          <StringList 
            label="Elements:" 
            content={rule.elements} 
            textSize={textSize} 
            labelSize={labelSize}
            bgColor={theme.colors.warning.text}
            color='black'
          />
        </div></RuleInputWrapper>
        {rule.function && 
          <RuleInputWrapper isIcon={false}> 
          <FunctionList
            bgColor={theme.colors.background.secondary}
            label="Function:" 
            textSize={textSize} 
            labelSize={labelSize} 
            rule={rule} 
            func={rule.function as FunctionElement}
        /></RuleInputWrapper>} 
        {rule.getActions().areActions && <RuleInputWrapper isIcon={false}><ActionsDisplay label="Unconditional Actions:" textSize={textSize} action={rule.getActions().Action}></ActionsDisplay></RuleInputWrapper>}

      </div>
    </div>
  );
};
