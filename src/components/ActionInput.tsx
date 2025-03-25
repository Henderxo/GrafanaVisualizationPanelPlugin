import React, { useState } from 'react';
import { 
  Input, 
  Text, 
  Button, 
  MultiSelect,
  IconButton,
  Badge,
  useTheme2
} from '@grafana/ui';
import { Action } from 'types/types';
import RuleInputWrapper from '../components/RuleInputWrapper';
import { css } from '@emotion/css';

interface ActionInputProps {
  action?: Action;
  onChange: (updatedAction: Action) => void;
  label?: string;
  actionBackgroundColor?: string
}

export const ActionInput: React.FC<ActionInputProps> = ({ 
  action = {}, 
  onChange,
  label = 'Actions:',
  actionBackgroundColor
}) => {
  const actionTypes: Array<keyof Action> = [
    'bindData', 
    'applyClass', 
    'applyText', 
    'applyStyle', 
    'applyShape'
  ];

  const [activeActions, setActiveActions] = useState<Array<keyof Action>>([]);
  const theme = useTheme2()
  const handleAddAction = (actionType: keyof Action) => {
    if (!activeActions.includes(actionType)) {
      const newActiveActions = [...activeActions, actionType];
      setActiveActions(newActiveActions);
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
        );
      case 'applyText':
        return (
          <Input
            label={actionType}
            placeholder={`Enter ${actionType}`}
            value={action.applyText || ''}
            onChange={(e) => onChange({...action, applyText: e.currentTarget.value})}
          />
        );
      case 'applyShape':
        return (
          <Input
            label={actionType}
            placeholder={`Enter ${actionType}`}
            value={action.applyShape || ''}
            onChange={(e) => onChange({...action, applyShape: e.currentTarget.value})}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div 
      className={css`
        display: flex; 
        gap: 8px; 
        margin-bottom: 16px; 
        flex-wrap: wrap;
        align-items: center;
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
        <RuleInputWrapper 
            backgroundColor={actionBackgroundColor??theme.colors.background.primary}
            key={actionType}
            onDelete={() => handleRemoveAction(actionType)}
        >
          {renderActionInput(actionType)}
        </RuleInputWrapper>
      ))}
    </div>
  );
};