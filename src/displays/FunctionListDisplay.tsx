import React, { useEffect, useState } from 'react';
import { 
  Collapse, 
  Box,
  Text, 
  Badge,
  LoadingPlaceholder,
  useTheme2
} from '@grafana/ui';
import { FunctionElement, ConditionElement, Action, YamlBindRule, YamlStylingRule, customHtmlBase } from 'types/types';
import { css } from '@emotion/css';
import { ActionsDisplay } from './ActionsDisplay';

interface FunctionDisplayProps extends customHtmlBase{
  rule: YamlBindRule | YamlStylingRule
  func: FunctionElement | null;
  label: string;
}



const ConditionDisplay: React.FC<{ 
  condition: ConditionElement; 
  type: 'if' | 'else_if' | 'else';
  index?: number;
  bgColor?: string
  textSize: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p'
}> = ({ condition, type, index, textSize ,bgColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setIsLoading(true)
    setIsOpen(false);
    setIsLoading(false)
  }, [condition]);

  let label = '';
  switch (type) {
    case 'if':
      label = 'If';
      break;
    case 'else_if':
      label = `Else If ${index !== undefined ? index + 1 : ''}`;
      break;
    case 'else':
      label = 'Else';
      break;
  }

  return (
    <Box>
      {!isLoading && <Collapse className={css`background-color: ${bgColor??useTheme2().colors.background.primary}`}
        onToggle={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
        label={`${label}: ${condition.condition || 'No condition'}`}
      >
        {isOpen && <ActionsDisplay backGroundColor={bgColor} action={condition.action} textSize={textSize} />}
      </Collapse>}
      {isLoading && <LoadingPlaceholder text={'Loading...'}></LoadingPlaceholder>}
    </Box>
  );
};

export const FunctionDisplay: React.FC<FunctionDisplayProps> = ({ bgColor, func, label, labelSize = 'span', textSize = 'span' }) => {

  const renderFunction = (func: string | FunctionElement) => {
    if (typeof func === 'string') {
      return (
        <Box marginBottom={1}>
          <Badge color="red" text={func} />
        </Box>
      );
    }
    
    return (
      <Box >
        {func.if && (
          <ConditionDisplay bgColor={bgColor} textSize={textSize} condition={func.if} type="if" />
        )}
        
        {func.else_if && func.else_if.map((elseIf, i) => (
          <ConditionDisplay 
            bgColor={bgColor}
            textSize={textSize}
            key={`else_if_${i}`} 
            condition={elseIf} 
            type="else_if" 
            index={i} 
          />
        ))}
        
        {func.else && (
          <ConditionDisplay bgColor={bgColor} textSize={textSize} condition={{action: func.else.action, condition: ''}} type="else" />
        )}
      </Box>
    );
  };
  
  return (
    <Box>
      <Text element={labelSize}>{label}</Text>
      <Box>
        {func && renderFunction(func)}
      </Box>
    </Box>
  );
};

export default FunctionDisplay;