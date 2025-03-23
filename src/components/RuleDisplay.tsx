import React, { useState } from "react";
import { YamlBindRule, YamlStylingRule } from "types/types";
import StringList from "./StringListDisplay";
import { useTheme2, Text, Divider, Stack } from '@grafana/ui'; // Import Grafana theme hook and Text component
import FunctionList from "./FunctionListDisplay";

interface RuleDisplayProps {
  rule: YamlBindRule | YamlStylingRule;
  height: string
}

export const RuleDisplay: React.FC<RuleDisplayProps> = ({ rule, height }) => {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme2();
  
  const bgHoverColor = theme.colors.border.medium; // Using theme's canvas background for hover
  const bgColor = theme.colors.background.secondary; // Using secondary background for normal state

  const renderElementItem = (element: string, index: number) => {
    return (
      <div 
        key={index}
        style={{
          background: theme.colors.warning.main,
          color: theme.colors.warning.contrastText,
          padding: '8px 12px',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 4px 4px 0',
          fontSize: '12px',
          fontWeight: 500
        }}
      >
        {element}
      </div>
    );
  };

  return (
    <div
      style={{
        height: height,
        padding: '15px',
        background: isHovered ? bgHoverColor : bgColor,
        borderRadius: '10px',
        transition: 'background-color 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)} 
    >
      <h4 style={{ fontSize: '24px', marginBottom: '8px', color: theme.colors.text.primary, display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
        <Text>{`${rule.id}`}</Text>
      </h4>
      <Divider/>
      <div>
        <Text><strong>Priority:</strong> {rule?.priority ? rule?.priority : 'default'}</Text>
        {/* Elements display using Stack directly */}
        {/* <div style={{ marginTop: '12px' }}>
          <Text variant="bodySmall"><strong>Elements:</strong></Text>
          <div style={{ margin: '8px 0' }}>
            <Stack 
              direction="row" 
              wrap="wrap" 
              alignItems="center" 
              justifyContent="flex-start" 
              gap={2}
            >
              {rule.elements && rule.elements.length > 0 ? (
                rule.elements.map((element, i) => renderElementItem(element, i))
              ) : (
                <Text variant="bodySmall" color="secondary">No elements defined</Text>
              )}
            </Stack>
          </div>
        </div> */}
        <StringList label="Elements:" content={rule.elements?rule.elements:[]}></StringList>
        <FunctionList  label="Functions:" functions={rule.function as [] ? rule.function as[] : []}></FunctionList>
      </div>
    </div>
  );
};
