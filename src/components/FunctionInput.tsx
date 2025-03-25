import React, { useState } from 'react';
import { 
  Input, 
  Text, 
  Select, 
  TabsBar, 
  Tab, 
  useTheme2
} from '@grafana/ui';
import { FunctionElement } from 'types/types';
import RuleInputWrapper from './RuleInputWrapper';
import { ActionInput } from './ActionInput';


interface FunctionInputProps {
  functionData: string | FunctionElement | undefined;
  onFunctionChange: (updatedFunction: string | FunctionElement) => void;
  forceUpdate: () => void;
}

export const FunctionInput: React.FC<FunctionInputProps> = ({ 
  functionData, 
  onFunctionChange, 
  forceUpdate 
}) => {
  const [activeTab, setActiveTab] = useState('if');
  const theme = useTheme2()

  const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'if' | 'else_if' = 'if', index?: number) => {
    if (functionData && typeof functionData !== 'string') {
      const updatedFunction = { ...functionData };
      
      if (type === 'if') {
        if (updatedFunction.if) {
          updatedFunction.if.condition = e.currentTarget.value;
        }
      } else if (type === 'else_if' && updatedFunction.else_if) {
        if (index !== undefined && index >= 0) {
          updatedFunction.else_if[index].condition = e.currentTarget.value;
        }
      }
      
      onFunctionChange(updatedFunction);
      forceUpdate();
    }
  };

  const handleActionChange = (action: any, type: 'if' | 'else_if' | 'else', index?: number) => {
    if (functionData && typeof functionData !== 'string') {
      const updatedFunction = { ...functionData };
      
      if (type === 'if' && updatedFunction.if) {
        updatedFunction.if.action = action;
      } else if (type === 'else_if' && updatedFunction.else_if && index !== undefined) {
        updatedFunction.else_if[index].action = action;
      } else if (type === 'else' && updatedFunction.else) {
        updatedFunction.else.action = action;
      }
      
      onFunctionChange(updatedFunction);
      forceUpdate();
    }
  };

  if (!functionData || typeof functionData === 'string') {
    return (
      <RuleInputWrapper>
        <Text>Function:</Text>
        <Select 
          placeholder="Function" 
          value={functionData || ''} 
          onChange={(e) => onFunctionChange(e.currentTarget.value)}
          className="mb-2"
        />
      </RuleInputWrapper>
    );
  }

  return (
    <RuleInputWrapper>
      <TabsBar>
        <Tab 
          label="If" 
          active={activeTab === 'if'} 
          onChangeTab={() => setActiveTab('if')}
        />
        {functionData.else_if && (
          <Tab 
            label="Else If" 
            active={activeTab === 'else_if'} 
            onChangeTab={() => setActiveTab('else_if')}
          />
        )}
        {functionData.else && (
          <Tab 
            label="Else" 
            active={activeTab === 'else'} 
            onChangeTab={() => setActiveTab('else')}
          />
        )}
      </TabsBar>

      {activeTab === 'if' && functionData.if && (
        <div>
            <div style={{marginTop: '5px', marginBottom: '10px'}}>
                <Text>Condition:</Text>
                <Input 
                    placeholder="Condition" 
                    value={functionData.if.condition || ''} 
                    onChange={(e) => handleConditionChange(e)}
                    className="mb-2"
                />
            </div>
            <div style={{marginTop: '5px', marginBottom: '5px'}}>
                <ActionInput 
                    action={functionData.if.action} 
                    onChange={(action) => handleActionChange(action, 'if')}
                />
            </div>
        </div>
      )}

      {activeTab === 'else_if' && functionData.else_if && (
        <div>
          {functionData.else_if.map((elseIfCondition, index) => (
            <div key={index} style={{marginTop: '5px', marginBottom: '5px'}}>
                <RuleInputWrapper backgroundColor={theme.colors.background.secondary} icon={'x'} isIcon={functionData.else_if && functionData.else_if?.length>1}>
                    <div style={{ marginBottom: '10px'}}>
                        <Text>Condition:</Text>
                        <Input 
                            placeholder="Condition" 
                            value={elseIfCondition.condition || ''} 
                            onChange={(e) => handleConditionChange(e, 'else_if', index)}
                            className="mb-2"
                        />
                    </div>
                    <div style={{ marginTop: '5px'}}>                     
                        <ActionInput 
                            actionBackgroundColor={theme.colors.background.secondary}
                            action={elseIfCondition.action} 
                            onChange={(action) => handleActionChange(action, 'else_if', index)}
                        />
                    </div>
                </RuleInputWrapper>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'else' && functionData.else && (
        <div style={{marginTop: '5px', marginBottom: '10px'}}>
          <ActionInput 
            action={functionData.else.action} 
            onChange={(action) => handleActionChange(action, 'else')}
          />
        </div>
      )}
    </RuleInputWrapper>
  );
};