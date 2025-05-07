import React, { useEffect, useState } from 'react';
import { 
  Input, 
  Text, 
  MultiSelect,
  Badge,
  useTheme2,
  Box,
  Field,
  Select
} from '@grafana/ui';
import { Action, FlowClass, FlowVertexTypeParam } from '../../types';
import RuleInputWrapper from '../wrappers/RuleInputWrapper';
import { css } from '@emotion/css';
import { useRuleStateContext } from 'modals/configureRuleModal/ruleContext';

interface ActionInputProps {
  action?: Action;
  onChange: (updatedAction: Action) => void;
  label?: string;
  type: 'binding' | 'styling'
  actionBackgroundColor?: string
  possibleClasses: Map<string, FlowClass>
  onLoaded?: (status: boolean) => void;
  validationPrefix?: string;
}

export const ActionInput: React.FC<ActionInputProps> = ({ 
  action = {}, 
  onChange,
  type,
  possibleClasses,
  label = 'Currently added actions:',
  actionBackgroundColor,
  onLoaded,
  validationPrefix
}) => {
  const actionTypes: Array<keyof Action> = type === 'binding' 
    ? ['bindData'] 
    : ['applyClass', 'applyText', 'applyStyle', 'applyShape'];

  const shapeOptions: Array<{label: string, value: FlowVertexTypeParam}> = [
    { label: 'Square', value: 'square' },
    { label: 'Double Circle', value: 'doublecircle' },
    { label: 'Circle', value: 'circle' },
    { label: 'Ellipse', value: 'ellipse' },
    { label: 'Stadium', value: 'stadium' },
    { label: 'Subroutine', value: 'subroutine' },
    { label: 'Rectangle', value: 'rect' },
    { label: 'Cylinder', value: 'cylinder' },
    { label: 'Round', value: 'round' },
    { label: 'Diamond', value: 'diamond' },
    { label: 'Hexagon', value: 'hexagon' },
    { label: 'Odd', value: 'odd' },
    { label: 'Trapezoid', value: 'trapezoid' },
    { label: 'Inverted Trapezoid', value: 'inv_trapezoid' },
    { label: 'Lean Right', value: 'lean_right' },
    { label: 'Lean Left', value: 'lean_left' }
  ];

  const [activeActions, setActiveActions] = useState<Array<keyof Action>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const theme = useTheme2()

  const {validationErrors} = useRuleStateContext()

  useEffect(()=>{
    setIsLoading(true)
    const incomingActionKeys = Object.keys(action) as Array<keyof Action>;
    
    const filteredActionKeys = incomingActionKeys.filter(key => 
      type === 'binding' ? key === 'bindData' : key !== 'bindData'
    );

    const newActiveActions = [...new Set([
      ...filteredActionKeys
    ])];

    setActiveActions(newActiveActions);
    setIsLoading(false)
    onLoaded&&onLoaded(true)
  }, [action, type])

  const handleAddAction = (actionType: keyof Action) => {
    validationErrors.action&&delete validationErrors.action
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
    
    const updatedAction = {...action};
    delete updatedAction[actionType];
    onChange(updatedAction);
  };

  const renderActionInput = (actionType: keyof Action) => {
    switch (actionType) {
      case 'bindData':
        return (
          <>
            <Text>{actionType}</Text>
            <Field invalid={validationErrors[`${validationPrefix?`${validationPrefix}action.`:''}bindData`]?true:false} error={validationErrors[`${validationPrefix?`${validationPrefix}action.`:''}bindData`]}>
              <MultiSelect
                label={actionType}
                placeholder={`Select ${actionType} `}
                value={action[actionType] || []}
                onChange={(selected) => {
                  const values = selected.map(s => s.value).filter((v): v is string => v !== undefined);
                  onChange({...action, [actionType]: values});
                }}
                options={(action[actionType] || []).map(value => ({
                  label: value,
                  value: value
                }))}
                allowCustomValue
              />
            </Field>
          </>
        );
      case 'applyClass':
        return (
          <>
            <Text>{actionType}</Text>
            <Field invalid={validationErrors[`${validationPrefix?`${validationPrefix}action.`:''}applyClass`]?true:false} error={validationErrors[`${validationPrefix?`${validationPrefix}action.`:''}applyClass`]}>
              <MultiSelect
                label={actionType}
                placeholder={`Select ${actionType}`}
                value={action.applyClass || []}
                onChange={(selected) => {
                  const values = selected.map(s => s.value).filter((v): v is string => v !== undefined);
                  onChange({...action, applyClass: values});
                }}
                options={Array.from(possibleClasses.keys()).map(className => ({
                  label: className,
                  value: className
                }))}
                allowCustomValue
              />
            </Field>
          </>
        );
      case 'applyStyle':
        return (
          <>
            <Text>{actionType}</Text>
            <Field invalid={validationErrors[`${validationPrefix?`${validationPrefix}action.`:''}applyStyle`]?true:false} error={validationErrors[`${validationPrefix?`${validationPrefix}action.`:''}applyStyle`]}>
              <MultiSelect
                label={actionType}
                placeholder={`Select ${actionType}`}
                value={action[actionType] || []}
                onChange={(selected) => {
                  const values = selected.map(s => s.value).filter((v): v is string => v !== undefined);
                  onChange({...action, [actionType]: values});
                }}
                options={(action[actionType] || []).map(value => ({
                  label: value,
                  value: value
                }))}
                allowCustomValue
              />
            </Field>
          </>
        );
      case 'applyText':
        return (
          <>
            <Text>{actionType}</Text>
            <Field invalid={validationErrors[`${validationPrefix?`${validationPrefix}action.`:''}applyText`]?true:false} error={validationErrors[`${validationPrefix?`${validationPrefix}action.`:''}applyText`]} className={css`margin: 0px;`}>
              <Input
                label={actionType}
                placeholder={`Enter ${actionType}`}
                value={action.applyText || ''}
                onChange={(e) => onChange({...action, applyText: e.currentTarget.value})}
              />
            </Field>
          </>
        );
      case 'applyShape':
        return (
          <>
            <Text>{actionType}</Text>
            <Field invalid={validationErrors[`${validationPrefix?`${validationPrefix}action.`:''}applyShape`]?true:false} error={validationErrors[`${validationPrefix?`${validationPrefix}action.`:''}bindData`]}>
              <Select
                label={actionType}
                placeholder={`Select ${actionType}`}
                value={action.applyShape || ''}
                onChange={(selected) => {
                  onChange({...action, applyShape: selected.value});
                }}
                options={shapeOptions}
              />
            </Field>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      {!isLoading && actionTypes.length !== activeActions.length &&
      <Field invalid={validationErrors[`${validationPrefix?`${validationPrefix}`:''}action`]?true:false} error={validationErrors[`${validationPrefix?`${validationPrefix}`:''}action`]}>
        <div 
          className={css`
            display: flex; 
            gap: 2px; 
            flex-wrap: nowrap;
            margin-bottom: 16px; 
            align-items: center;
            width: 100%;
          `}
      >
      <Text>Possible actions:</Text>
      {actionTypes.map(actionType => (
        !activeActions.includes(actionType)  && (
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
    </div></Field>
    }
      {activeActions.length > 0 && <Text>{label}</Text>}
      {activeActions.map(actionType => (
        <div key={actionType} style={{width: '100%'}}>
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