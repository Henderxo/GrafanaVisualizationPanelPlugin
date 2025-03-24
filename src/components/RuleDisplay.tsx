import React, { useEffect, useState } from "react";
import { customHtmlBase, FunctionElement, YamlBindRule, YamlFunction, YamlStylingRule } from "types/types";
import StringList from "./StringListDisplay";
import { useTheme2, Text, Divider, TabsBar, Tab } from '@grafana/ui';
import FunctionList from "./FunctionListDisplay";
import { css } from '@emotion/css';

interface RuleDisplayProps extends customHtmlBase {
  rule: YamlBindRule | YamlStylingRule;
  functions: YamlFunction[];
  height?: string;
}

export const RuleDisplay: React.FC<RuleDisplayProps> = ({ 
  hover = false, 
  functions, 
  rule, 
  height = '100%', 
  textSize = 'span', 
  labelSize = 'span' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme2();
  
  const bgHoverColor = theme.colors.border.medium;
  const bgColor = theme.colors.background.secondary;

  useEffect(() => {

    
    if (rule.function) {
      if (typeof rule.function === 'string') {
        const foundFunction = functions.find((functionn) => functionn.id === rule.function)?.function;
        if (foundFunction) {
          rule.function = foundFunction; 
        } else {
          rule.function = {};
        }
      }
    }
  }, [rule, functions]);

  return (
    <div
      className={css`
        height: ${height};
        padding: 17px;
        background: ${isHovered ? bgHoverColor : bgColor};
        border-radius: 10px;
        transition: background-color 0.3s ease;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      `}
      onMouseEnter={() => setIsHovered(hover)} 
      onMouseLeave={() => setIsHovered(false)} 
    >
      <h3 className={css`
        margin-bottom: 8px;
        color: ${theme.colors.text.primary};
        display: flex;
        flex-direction: row;
        justify-content: center;
      `}>
        <Text>{`${rule.id}`}</Text>
      </h3>
      <Divider/>
      <div className={css`flex: 1;`}>
        <Text truncate={true} element={textSize}>Priority: {rule?.priority ? rule?.priority : 'default'}</Text>
        <div className={css`margin-top: 4px; margin-bottom: 4px;`}>
          <StringList 
            label="Elements:" 
            content={rule.elements ? rule.elements : []} 
            textSize={textSize} 
            labelSize={labelSize}
          />
        </div>
        {rule.function && <div><Divider/>
        <FunctionList 
          label="Function:" 
          textSize={textSize} 
          labelSize={labelSize} 
          rule={rule} 
          func={rule.function as FunctionElement}
        /></div>}
      </div>
    </div>
  );
};