import React, { useEffect, useState } from 'react';
import { 
  Input, 
  Text, 
  TabsBar, 
  Tab, 
  useTheme2,
  LoadingPlaceholder
} from '@grafana/ui';
import { FlowClass, FunctionElement } from '../../types';
import RuleInputWrapper from 'components/wrappers/RuleInputWrapper';
import { ActionInput } from './ActionInput';


interface FunctionInputProps {
  possibleClasses: Map<string, FlowClass>
  functionData: FunctionElement | undefined;
  type: 'styling' | 'binding'
  onFunctionChange: (updatedFunction: FunctionElement | undefined, deletedTab?: string) => void;
  forceUpdate: () => void;
  activeTab: 'if' | 'else_if' | 'else';
  onActiveTabChange: (tab: 'if' | 'else_if' | 'else') => void;
  onLoaded: (state: boolean) => void 
}

export const FunctionInput: React.FC<FunctionInputProps> = ({ 
  functionData,
  possibleClasses,
  onFunctionChange, 
  forceUpdate,
  type,
  activeTab,
  onActiveTabChange,
  onLoaded
}) => {
  const theme = useTheme2()
  const [isLoaded, setisLoaded] = useState<boolean>(false)

  const handleConditionChange = (e: React.FormEvent<HTMLInputElement>, type: 'if' | 'else_if' = 'if', index?: number) => {
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

  useEffect(() => {
    onActiveTabChange('if'); 
  }, []);

  const handleActionChange = (action: any, type: 'if' | 'else_if' | 'else', index?: number) => {
    if (functionData && typeof functionData !== 'string') {
      const updatedFunction = JSON.parse(JSON.stringify(functionData));

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

  const handleActionDelete = (index: number) => {
    if (functionData && typeof functionData !== 'string') {
      const updatedFunction = JSON.parse(JSON.stringify(functionData));
      
      if (updatedFunction.else_if) {
        updatedFunction.else_if = updatedFunction.else_if
          .filter((_: any, i: any) => i !== index)
          .filter((item:any) => item !== null && item !== undefined);
      }
      
      onFunctionChange(updatedFunction);
      forceUpdate();
    }
  }

  const handleConditionDelete = () =>{
      if(activeTab !== 'if'){
        if (functionData && typeof functionData !== 'string'){
          const updatedFunction = { ...functionData };
        
        if (activeTab === 'else_if' && updatedFunction.else_if) {
          delete updatedFunction.else_if
        } else if (activeTab === 'else' && updatedFunction.else) {
          delete updatedFunction.else
        }
        onFunctionChange(updatedFunction, activeTab)
        onActiveTabChange('if')
      }
    }else{
      onFunctionChange(undefined)
    }
    forceUpdate()
  }
  if(functionData)
  return (
    <RuleInputWrapper  onDelete={()=>{handleConditionDelete()}}>
      <TabsBar>
        <Tab 
          label="If" 
          active={activeTab === 'if'} 
          onChangeTab={() => {
            activeTab!=="if"&&setisLoaded(false)
            onActiveTabChange('if') 
          }}
        />
        {functionData.else_if && (
          <Tab 
            label="Else If" 
            active={activeTab === 'else_if'} 
            onChangeTab={() => {
              activeTab!=="else_if"&&setisLoaded(false)
              onActiveTabChange('else_if')
            }}
          />
        )}
        {functionData.else && (
          <Tab 
            label="Else" 
            active={activeTab === 'else'} 
            onChangeTab={() => {
              activeTab!=="else"&&setisLoaded(false)
              onActiveTabChange('else')
            }}
          />
        )}
      </TabsBar>

      {activeTab === 'if'  && functionData.if  && (
        <div style={{marginTop: '5px', marginBottom: '10px', width: '100%'}}>
          <RuleInputWrapper backgroundColor={theme.colors.background.secondary} isIcon={false}>
              {isLoaded ? (<div style={{marginTop: '5px', marginBottom: '10px'}}>
                  <Text>Condition:</Text>
                  <Input 
                      placeholder="Condition" 
                      value={functionData.if.condition || ''} 
                      onChange={(e) => handleConditionChange(e)}
                      className="mb-2"
                  />
              </div>):(<LoadingPlaceholder text={'Loading...'}></LoadingPlaceholder>)}
              <div style={{marginTop: '5px', marginBottom: '5px'}}>
                  <ActionInput 
                    possibleClasses={possibleClasses}
                      type={type}
                      actionBackgroundColor={theme.colors.background.primary}
                      action={functionData.if.action} 
                      onChange={(action) => handleActionChange(action, 'if')}
                      onLoaded={(status)=>{
                        setisLoaded(status)
                        onLoaded(status)
                      }}
                  />
              </div>
          </RuleInputWrapper>
        </div>
      )}

      {activeTab === 'else_if' && functionData.else_if  && (
        <div>
          <form></form>
          {functionData.else_if.map((elseIfCondition, index) => (
            <div key={index} style={{marginTop: '5px', marginBottom: '5px'}}>
                <RuleInputWrapper onDelete={()=>handleActionDelete(index)} backgroundColor={theme.colors.background.secondary} icon={'x'} isIcon={functionData.else_if && functionData.else_if?.length>1}>
                    {isLoaded ? (<div style={{ marginBottom: '10px'}}>
                        <Text>Condition:</Text>
                        <Input 
                            placeholder="Condition" 
                            value={elseIfCondition.condition || ''} 
                            onChange={(e) => handleConditionChange(e , 'else_if', index)}
                            className="mb-2"
                        />
                    </div>):(<LoadingPlaceholder text={'Loading...'}></LoadingPlaceholder>)}
                    <div style={{ marginTop: '5px'}}>                     
                        <ActionInput
                            possibleClasses={possibleClasses}
                            type={type}
                            actionBackgroundColor={theme.colors.background.primary}
                            action={elseIfCondition.action} 
                            onChange={(action) => handleActionChange(action, 'else_if', index)}
                            onLoaded={(status)=>{
                              setisLoaded(status)
                              onLoaded(status)
                            }}
                        />
                    </div>
                </RuleInputWrapper>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'else' && functionData.else &&  (
        <div style={{marginTop: '5px', marginBottom: '10px'}}>
          <RuleInputWrapper backgroundColor={theme.colors.background.secondary} isIcon={false}>
             <ActionInput 
             possibleClasses={possibleClasses}
              type={type}
              actionBackgroundColor={theme.colors.background.primary}
              action={functionData.else.action} 
              onChange={(action) => handleActionChange(action, 'else')}
              onLoaded={(status)=>{
                setisLoaded(status)
                onLoaded(status)
              }}
            />
            {!isLoaded && <LoadingPlaceholder text={'Loading...'}></LoadingPlaceholder>}
          </RuleInputWrapper>
        </div>
      )}
    </RuleInputWrapper>
  );return(<></>)
};