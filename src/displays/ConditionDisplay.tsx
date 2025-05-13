import { Box, Collapse, LoadingPlaceholder, useTheme2 } from "@grafana/ui";
import React, { useEffect, useState } from "react";
import { ConditionElement } from '../types';
import { ActionsDisplay } from "./ActionsDisplay";
import { css } from "@emotion/css";

export const ConditionDisplay: React.FC<{ 
  condition: ConditionElement; 
  type: 'if' | 'else_if' | 'else';
  index?: number;
  bgColor?: string
  textSize: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p'
}> = ({ condition, type, index, textSize ,bgColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setIsLoading(true)
    setIsOpen(false);
    setIsLoading(false)
  }, [condition]);

  const color = useTheme2().colors.background.primary
  let label = '';
  switch (type) {
    case 'if':
      label = 'If';
      break;
    case 'else_if':
      label = `Else If [${index !== undefined ? index + 1 : ''}]`;
      break;
    case 'else':
      label = 'Else';
      break;
  }

  return (
    <Box>
      {!isLoading && <Collapse className={css`background-color: ${bgColor??color}`}
        onToggle={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
        label={`${label}: ${condition.condition || 'No condition'}`}
      >
        {isOpen && <ActionsDisplay backGroundColor={bgColor} action={condition.action} textSize={textSize} />}
      </Collapse>}
      {isLoading && <LoadingPlaceholder text={'Loading...'}></LoadingPlaceholder>}
    </Box>
  );
};
