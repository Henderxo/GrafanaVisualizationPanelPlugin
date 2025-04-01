import React, { useEffect, useState } from "react";
import { Action, customHtmlBase, FlowClass, FunctionElement, YamlBindRule, YamlStylingRule } from "types/types";
import StringList from "./StringListDisplay";
import { useTheme2, Text, Divider, TabsBar, Tab, PageToolbar, ToolbarButton, ConfirmModal } from '@grafana/ui';
import FunctionList, { ActionDisplay } from "./FunctionListDisplay";
import { css } from '@emotion/css';
import { CreateRuleModal } from "modals/CreateRule";
import RuleInputWrapper from "components/wrappers/RuleInputWrapper";

interface RuleDisplayProps extends customHtmlBase {
  rule: YamlBindRule | YamlStylingRule;
  height?: string;
  elements: string[]
  possibleClasses: Map<string, FlowClass>
  onEditSubmit: (rule: YamlBindRule | YamlStylingRule, oldRule: string) => void;
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
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      `}
      onMouseEnter={() => setIsHovered(hover)} 
      onMouseLeave={() => setIsHovered(false)} 
    >
      {isEditModalOpen && <CreateRuleModal
      isEdit={true} 
      possibleClasses={possibleClasses}
      rule={rule}
      elements={elements}
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      onSubmit={(newRule) =>onEditSubmit(newRule, rule.id)}/>}
      <ConfirmModal 
        modalClass={css`top: 30%;`}
        isOpen={isDeleteModalOpen} 
        title={`Delete Rule: ${rule.id}`} 
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
     <PageToolbar className={css`background: ${isHovered ? bgHoverColor : bgColor}; padding: 1px; padding-top: 3px; padding-bottom: 3px;`} title={`${rule.id}`} >
      <ToolbarButton onClick={()=>setIsEditModalOpen(true)} iconSize="lg" className={css`&:hover{ background-color: ${theme.colors.background.primary}}`} icon="edit">Edit</ToolbarButton>
      <ToolbarButton onClick={()=>setIsDeleteModalOpen(true)} iconSize="lg" className={css`&:hover{ background-color: ${theme.colors.background.primary}}`} icon="trash-alt"></ToolbarButton>
     </PageToolbar>
      <Divider/>
      <div className={css`flex: 1;`}>
        <RuleInputWrapper isIcon={false}><Text truncate={true} element={textSize}>Priority: {rule?.priority ? rule?.priority : '-1'}</Text></RuleInputWrapper>
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
        {rule.getActions().areActions && <RuleInputWrapper isIcon={false}><ActionDisplay label="General Actions:" textSize={textSize} action={rule.getActions().Action}></ActionDisplay></RuleInputWrapper>}

      </div>
    </div>
  );
};