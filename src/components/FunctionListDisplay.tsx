import React, { useState } from 'react';
import { 
  useTheme2, 
  Collapse, 
  Icon, 
  Box,
  Text, 
  Badge,
  Stack
} from '@grafana/ui';
import { FunctionElement, ConditionElement, Action } from 'types/types';

interface FunctionDisplayProps {
  functions: (string | FunctionElement)[];
  label: string;
}

// Component to display action details (bindData, applyClass, applyText, etc.)
const ActionDisplay: React.FC<{ action: Action }> = ({ action }) => {
  const theme = useTheme2();
  
  return (
    <Box >
      {action.bindData && (
        <Box marginBottom={1}>
          <Text variant="bodySmall"><strong>Bind Data:</strong></Text>
          <Stack direction="row" wrap="wrap" gap={1}>
            {action.bindData.map((item, i) => (
              <Badge key={i} color="blue" text={item} />
            ))}
          </Stack>
        </Box>
      )}
      
      {action.applyClass && (
        <Box marginBottom={1}>
          <Text variant="bodySmall"><strong>Apply Class:</strong></Text>
          <Stack direction="row" wrap="wrap" gap={1}>
            {action.applyClass.map((item, i) => (
              <Badge key={i} color="green" text={item} />
            ))}
          </Stack>
        </Box>
      )}
      
      {action.applyText && (
        <Box marginBottom={1}>
          <Text variant="bodySmall"><strong>Apply Text:</strong></Text>
          <Text variant="bodySmall">{action.applyText}</Text>
        </Box>
      )}
      
      {action.applyStyle && (
        <Box marginBottom={1}>
          <Text variant="bodySmall"><strong>Apply Style:</strong></Text>
          <Stack direction="row" wrap="wrap" gap={1}>
            {action.applyStyle.map((item, i) => (
              <Badge key={i} color="purple" text={item} />
            ))}
          </Stack>
        </Box>
      )}
      
      {action.applyShape && (
        <Box marginBottom={1}>
          <Text variant="bodySmall"><strong>Apply Shape:</strong></Text>
          <Badge color="orange" text={action.applyShape} />
        </Box>
      )}
    </Box>
  );
};

// Component to display condition and its actions
const ConditionDisplay: React.FC<{ 
  condition: ConditionElement; 
  type: 'if' | 'else_if' | 'else';
  index?: number;
}> = ({ condition, type, index }) => {
  const theme = useTheme2();
  const [isOpen, setIsOpen] = useState(false); // Only 'if' is expanded by default
  console.log('Why i am not dysplayed idkxd')
  let label = '';
  switch(type) {
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
    <Box 
    >
      {/* <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          backgroundColor: theme.colors.background.secondary,
          borderRadius: '2px'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
        <Box>
          <Text variant="body">{label}: {condition.condition || 'No condition'}</Text>
        </Box>
      </div> */}
      <p>Dof</p>
      <Collapse onToggle={()=>{setIsOpen(!isOpen)}} isOpen={isOpen} label={`${label}: ${condition.condition || 'No condition'}`}>
          <ActionDisplay action={condition.action} />
      </Collapse>
    </Box>
  );
};

// Main component to display function elements
export const FunctionDisplay: React.FC<FunctionDisplayProps> = ({ functions, label }) => {
  const theme = useTheme2();
  
  const renderFunction = (func: string | FunctionElement, index: number) => {
    if (typeof func === 'string') {
      return (
        <Box key={index} marginBottom={1}>
          <Badge color="red" text={func} />
        </Box>
      );
    }
    
    return (
      <Box key={index} marginBottom={2}>
        {func.if && (
          <ConditionDisplay condition={func.if} type="if" />
        )}
        
        {func.else_if && func.else_if.map((elseIf, i) => (
          <ConditionDisplay 
            key={`else_if_${i}`} 
            condition={elseIf} 
            type="else_if" 
            index={i} 
          />
        ))}
        
        {func.else && (
          <ConditionDisplay condition={func.else} type="else" />
        )}
      </Box>
    );
  };
  
  return (
    <Box >
      <Text variant="bodySmall"><strong>{label}</strong></Text>
      <Box >
        {functions && functions.length > 0 ? (
          functions.map((func, i) => renderFunction(func, i))
        ) : (
          <Text variant="bodySmall" color="secondary">No functions defined</Text>
        )}
      </Box>
    </Box>
  );
};

export default FunctionDisplay;