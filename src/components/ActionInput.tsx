import React, { useEffect, useState } from 'react';
import { 
  Input, 
  Text, 
  Button, 
  MultiSelect,
  IconButton,
  Badge,
  useTheme2,
  Box
} from '@grafana/ui';
import { Action } from 'types/types';
import RuleInputWrapper from '../components/RuleInputWrapper';
import { css } from '@emotion/css';

interface ActionInputProps {
  action?: Action;
  onChange: (updatedAction: Action) => void;
  label?: string;
  type: 'binding' | 'styling'
  actionBackgroundColor?: string
  onLoaded?: (status: boolean) => void;
}

export const ActionInput: React.FC<ActionInputProps> = ({ 
  action = {}, 
  onChange,
  type,
  label = 'Actions:',
  actionBackgroundColor,
  onLoaded
}) => {
  // Dynamically filter action types based on the input type
  const actionTypes: Array<keyof Action> = type === 'binding' 
    ? ['bindData'] 
    : ['applyClass', 'applyText', 'applyStyle', 'applyShape'];

  const [activeActions, setActiveActions] = useState<Array<keyof Action>>([]);
  const theme = useTheme2()

  useEffect(()=>{
    console.log(type)
    const incomingActionKeys = Object.keys(action) as Array<keyof Action>;
    
    const filteredActionKeys = incomingActionKeys.filter(key => 
      type === 'binding' ? key === 'bindData' : key !== 'bindData'
    );

    const newActiveActions = [...new Set([
      ...activeActions, 
      ...filteredActionKeys
    ])];

    setActiveActions(newActiveActions);
    onLoaded&&onLoaded(true)
  }, [action, type])

  const handleAddAction = (actionType: keyof Action) => {

    const isAllowedAction = type === 'binding' 
      ? actionType === 'bindData' 
      : actionType !== 'bindData';

    if (isAllowedAction && !activeActions.includes(actionType)) {
      const newActiveActions = [...activeActions, actionType];
      setActiveActions(newActiveActions);

      const updatedAction = {...action};
      switch (actionType) {
        case 'bindData':
        case 'applyClass':
        case 'applyStyle':
          updatedAction[actionType] = [];
          break;
        case 'applyText':
        case 'applyShape':
          updatedAction[actionType] = '';
          break;
      }
      onChange(updatedAction);
    }
  };

  const handleRemoveAction = (actionType: keyof Action) => {
    const newActiveActions = activeActions.filter(a => a !== actionType);
    setActiveActions(newActiveActions);
    
    // Remove the action from the action object
    const updatedAction = {...action};
    delete updatedAction[actionType];
    onChange(updatedAction);
  };

  const renderActionInput = (actionType: keyof Action) => {
    switch (actionType) {
      case 'bindData':
      case 'applyClass':
      case 'applyStyle':
        return (
          <>
            <Text>{actionType}</Text>
            <MultiSelect
              label={actionType}
              placeholder={`Select ${actionType}`}
              value={action[actionType] || []}
              onChange={(selected) => {
                const values = selected.map(s => s.value);
                onChange({...action, [actionType]: values});
              }}
              options={(action[actionType] || []).map(value => ({
                label: value,
                value: value
              }))}
              allowCustomValue
            />
          </>
        );
      case 'applyText':
        return (
          <>
            <Text>{actionType}</Text>
            <Input
              label={actionType}
              placeholder={`Enter ${actionType}`}
              value={action.applyText || ''}
              onChange={(e) => onChange({...action, applyText: e.currentTarget.value})}
            />
          </>
        );
      case 'applyShape':
        return (
          <>
            <Text>{actionType}</Text>
            <Input
              label={actionType}
              placeholder={`Enter ${actionType}`}
              value={action.applyShape || ''}
              onChange={(e) => onChange({...action, applyShape: e.currentTarget.value})}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <div 
          className={css`
            display: flex; 
            gap: 2px; 
            margin-bottom: 16px; 
            flex-wrap: wrap;
            align-items: center;
            width: 100%;
          `}
      >
      {actionTypes.map(actionType => (
        !activeActions.includes(actionType) && (
          <Badge 
            key={actionType}
            color="blue"
            onClick={() => handleAddAction(actionType)}
            className={css`
              cursor: pointer;
              &:hover {
                opacity: 0.8;
              }
            `}
            text={`Add ${actionType.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
          >
          </Badge>
        )
      ))}
    </div>
      {activeActions.length > 0 && <Text>{label}</Text>}
      {activeActions.map(actionType => (
        <div style={{width: '100%'}}>
          <RuleInputWrapper 
              backgroundColor={actionBackgroundColor??theme.colors.background.primary}
              key={actionType}
              onDelete={() => handleRemoveAction(actionType)}
          >
            {renderActionInput(actionType)}
          </RuleInputWrapper>
        </div>
      ))}
    </Box>
  );
};