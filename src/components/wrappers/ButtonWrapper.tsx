import React from 'react';
import { Button } from '@grafana/ui';
import { css } from '@emotion/css';

interface ButtonWrapperProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const ButtonWrapper: React.FC<ButtonWrapperProps> = ({ 
  onClick, 
  children, 
  className 
}) => {
  const buttonStyle = css`
    margin-top: 4px; 
    margin-bottom: 4px;
    background: linear-gradient(45deg, #FFA500, rgb(255, 102, 0)); 
    color: black; 
    transition: background 0.3s ease; 
    &:hover {
      background: linear-gradient(45deg, #FF8C00, #FFA500); 
    }
  `;
  return (
    <Button 
      className={`${buttonStyle} ${className || ''}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

export default ButtonWrapper;