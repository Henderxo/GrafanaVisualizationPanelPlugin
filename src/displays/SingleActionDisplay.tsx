import { css } from "@emotion/css";
import { Badge, Box, Icon, Text } from "@grafana/ui";
import React from "react";
import { Action, ActionNames, TextSize } from "types/types";

export const SingleActionDisplay: React.FC<{ 
  label: string, 
  actionData: { actionName: ActionNames, action: Action }, 
  isEmptyText: string, 
  textSize: TextSize 
}> = ({ label, actionData, isEmptyText, textSize }) => {
    console.log(actionData)
  const singleAction = actionData.action[actionData.actionName];
  
  return (
    <Box marginBottom={1} marginTop={1}>
          <Text element={textSize}>{label}</Text>
          {singleAction && singleAction !== undefined && Array.isArray(singleAction) ? (
            (singleAction as string[]).length > 0 ? (
              (singleAction as string[]).map((item, i) => (
                <Badge 
                  key={i}
                  className={css`margin-right: 2px;`} 
                  color="green" 
                  text={<Text variant="body">{item}</Text>} 
                />
              ))
            ) : (
              <Badge 
                className={css`margin-right: 2px;`} 
                color="red" 
                text={
                  <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                    <Icon 
                      className={css`margin-right: 2px;`} 
                      name="exclamation-triangle" 
                      size="sm" 
                    />
                    <Text variant="body">{isEmptyText}</Text>
                  </div>
                } 
              />
            )
          ) : (
            singleAction !== undefined && singleAction.length > 0 ? (
              <Badge 
                className={css`margin-right: 2px;`} 
                color="green" 
                text={<Text variant="body">{singleAction as string}</Text>} 
              />
            ) : (
              <Badge 
                className={css`margin-right: 2px;`} 
                color="red" 
                text={
                  <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                    <Icon 
                      className={css`margin-right: 2px;`} 
                      name="exclamation-triangle" 
                      size="sm" 
                    />
                    <Text variant="body">{isEmptyText}</Text>
                  </div>
                } 
              />
            )
          )}
    </Box>
  );
};