import { Box, Text, useTheme2 } from "@grafana/ui";
import React from "react";
import { Action, ActionNames, TextSize } from "types/types";
import { SingleActionDisplay } from "./SingleActionDisplay";

export const ACTION_EMPTY_TEXT = {
  bindData: "No Data Bindings Found",
  applyClass: "No Classes Found",
  applyText: "No Text Found",
  applyStyle: "No Styles Found",
  applyShape: "No Shape Found"
};

export const ACTION_DISPLAY_LABELS = {
  bindData: "Bind Data:",
  applyClass: "Apply Class:",
  applyText: "Apply Text:",
  applyStyle: "Apply Style:",
  applyShape: "Apply Shape:"
};

export const ActionsDisplay: React.FC<{ 
  backGroundColor?: string, 
  label?: string, 
  action: Action, 
  textSize: TextSize,
  customEmptyText?: string,
  customLabels?: Record<string, string>
}> = ({ 
  backGroundColor, 
  label, 
  action, 
  textSize, 
  customEmptyText,
  customLabels
}) => {
  console.log(action)
  const theme = useTheme2();
  const actionNames = Object.keys(action);
  console.log(action)
  const getEmptyTextForAction = (actionName: string): string => {
    if (customEmptyText) {
      return customEmptyText;
    }
    
    return ACTION_EMPTY_TEXT[actionName as keyof Action] || "No Value Found";
  };

  const getDisplayLabelForAction = (actionName: string): string => {
    if (customLabels && customLabels[actionName]) {
      return customLabels[actionName];
    }
    
    return ACTION_DISPLAY_LABELS[actionName as keyof Action] || `${actionName}:`;
  };

  return (
    <>
      {label && <Text element={textSize}>{label}</Text>}
      <div style={{
        backgroundColor: backGroundColor ?? theme.colors.background.primary, 
        padding: label ? '1px' : '2px'
      }}>
        {actionNames.length > 0 ? (
          <Box>
            {actionNames.map((actionName, index) => (
              <SingleActionDisplay
                key={index}
                label={getDisplayLabelForAction(actionName)}
                actionData={{ actionName: (actionName as ActionNames), action }}
                isEmptyText={getEmptyTextForAction(actionName)}
                textSize={textSize}
              />
            ))}
          </Box>
        ) : (
          <Text element={textSize}>No Actions Found</Text>
        )}
      </div>
    </>
  );
};