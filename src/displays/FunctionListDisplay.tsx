import React, { useEffect, useState } from 'react';
import { 
  useTheme2, 
  Collapse, 
  Icon, 
  Box,
  Text, 
  Badge,
  Stack,
  Divider
} from '@grafana/ui';
import { FunctionElement, ConditionElement, Action, YamlBindRule, YamlStylingRule, customHtmlBase } from 'types/types';
import { css } from '@emotion/css';

interface FunctionDisplayProps extends customHtmlBase{
  rule: YamlBindRule | YamlStylingRule
  func: FunctionElement | null;
  label: string;
}

export const ActionDisplay: React.FC<{ backGroundColor?: string, label?: string, action: Action, textSize: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p' }> = ({backGroundColor, label, action, textSize }) => {
  return (
    <>
    {label&& <Text>{label}</Text>}
    <Box backgroundColor={'primary'} padding={label?1:0} >
      {action.bindData && (
        <Box marginBottom={1} marginTop={1}>
        <Text>Bind Data: </Text>
          {action.bindData.length > 0 ? (
            action.bindData.map((item, i) => (
              <Badge className={css`margin-right: 2px;`} color="green" text={<Text variant='body'>{item}</Text>} /> 
            ))
          ) : (
            <Badge className={css`margin-right: 2px;`} color="red" text={<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}><Icon className={css`margin-right: 2px;`} size={`sm`} name={`exclamation-triangle`}></Icon><Text variant='body'>{`No Data Found`}</Text></div>} />
          )}
      </Box>
      )}
      
      {action.applyClass && action.applyClass.length > 0 && (
        <Box marginBottom={1} marginTop={1}>
          <Text >Apply Class: </Text>
            {action.applyClass.map((item, i) => (
              <Badge className={css`margin-right: 2px;`} key={i} color="green" text={<Text variant='body'>{item}</Text>} />
            ))}
        </Box>
      )}
      
      {action.applyText && (
        <Box marginBottom={1} marginTop={1}>
          <Text >Apply Text: </Text>
          <Badge className={css`margin-right: 2px;`} color="green" text={<Text variant='body'>{action.applyText}</Text>} />
        </Box>
      )}
      
      {action.applyStyle && action.applyStyle.length > 0 && (
        <Box marginBottom={1} marginTop={1}>
          <Text >Apply Style: </Text>
            {action.applyStyle.map((item, i) => (
              <Badge className={css`margin-right: 2px;`} key={i} color="green" text={<Text variant='body'>{item}</Text>} />
            ))}
        </Box>
      )}
      
      {action.applyShape && (
        <Box marginBottom={1} marginTop={1}>
          <Text element={textSize} >Apply Shape: </Text>
          <Badge className={css`margin-right: 2px;`} color="green" text={<Text variant='body'>{action.applyShape}</Text>} />
        </Box>
      )}

      {!action.applyShape && !action.applyStyle  && !action.applyText && !action.applyClass && !action.bindData && (
        <Box marginBottom={1} marginTop={1}>
          <Text element={textSize} >No Actions Found</Text>
        </Box>
      )}

      {(action.applyStyle && action.applyStyle.length === 0) && (
        <Box marginBottom={1} marginTop={1}>
          <Text element={textSize} >Apply Style: </Text>
          <Badge className={css`margin-right: 2px;`} color="red" text={<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}><Icon className={css`margin-right: 2px;`} size={`sm`} name={`exclamation-triangle`}></Icon><Text variant='body'>{`No Styles Found`}</Text></div>} />
        </Box>
      )}

      {action.applyShape !== undefined && !action.applyShape &&  (
        <Box marginBottom={1} marginTop={1}>
          <Text element={textSize} >Apply Shape: </Text>
          <Badge className={css`margin-right: 2px;`} color="red" text={<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}><Icon className={css`margin-right: 2px;`} size={`sm`} name={`exclamation-triangle`}></Icon><Text variant='body'>{`No Shape Found`}</Text></div>} />
        </Box>
      )}  

      {(action.applyClass && action.applyClass.length === 0) && (
        <Box marginBottom={1} marginTop={1}>
          <Text element={textSize} >Apply Class: </Text>
          <Badge className={css`margin-right: 2px;`} color="red" text={<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}><Icon className={css`margin-right: 2px;`} size={`sm`} name={`exclamation-triangle`}></Icon><Text variant='body'>{`No Classes Found`}</Text></div>} />
        </Box>
      )}

      {action.applyText !== undefined && !action.applyText && (
        <Box marginBottom={1} marginTop={1}>
          <Text element={textSize} >Apply Text: </Text>
          <Badge className={css`margin-right: 2px;`} color="red" text={<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}><Icon className={css`margin-right: 2px;`} size={`sm`} name={`exclamation-triangle`}></Icon><Text variant='body'>{`No Text Found`}</Text></div>} />
        </Box>
      )}


    </Box>
    </>
  );
};

// Component to display condition and its actions
const ConditionDisplay: React.FC<{ 
  condition: ConditionElement; 
  type: 'if' | 'else_if' | 'else';
  index?: number;
  textSize: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p'
}> = ({ condition, type, index, textSize }) => {
  const [isOpen, setIsOpen] = useState(false); // Initially closed
  useEffect(() => {
    setIsOpen(false); // Reset state when condition changes
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
      <Collapse
        onToggle={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
        label={`${label}: ${condition.condition || 'No condition'}`}
      >
        {/* Ensure ActionDisplay only renders if it's open */}
        {isOpen && <ActionDisplay action={condition.action} textSize={textSize} />}
      </Collapse>
    </Box>
  );
};
// Main component to display function elements
export const FunctionDisplay: React.FC<FunctionDisplayProps> = ({ func, label, labelSize = 'span', textSize = 'span' }) => {

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
          <ConditionDisplay textSize={textSize} condition={func.if} type="if" />
        )}
        
        {func.else_if && func.else_if.map((elseIf, i) => (
          <ConditionDisplay 
            textSize={textSize}
            key={`else_if_${i}`} 
            condition={elseIf} 
            type="else_if" 
            index={i} 
          />
        ))}
        
        {func.else && (
          <ConditionDisplay textSize={textSize} condition={func.else} type="else" />
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