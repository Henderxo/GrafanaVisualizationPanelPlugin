import React from 'react';
import { 
  Box,
  Text, 
  Badge
} from '@grafana/ui';
import { FunctionElement,YamlBindRule, YamlStylingRule, customHtmlBase } from 'types/types';
import { ConditionDisplay } from './ConditionDisplay';

interface FunctionDisplayProps extends customHtmlBase{
  rule: YamlBindRule | YamlStylingRule
  func: FunctionElement | null;
  label: string;
}

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