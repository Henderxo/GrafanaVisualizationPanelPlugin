import React, { ReactNode, useState } from 'react';
import { Button, IconButton, IconName, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface RuleInputWrapperProps {
    children: ReactNode;
    onDelete?: () => void;
    backgroundColor?: string;
    icon?: IconName;
    isIcon?: boolean
}

const RuleInputWrapper: React.FC<RuleInputWrapperProps> = ({ children, onDelete, backgroundColor, icon, isIcon = true }) => {
    const [isHovered, setIsHovered] = useState(false);
    const theme = useTheme2();

    return (
        <div
            style={{
                borderRadius: '5px',
                display: 'flex',
                flexDirection: 'row',
                backgroundColor: backgroundColor??theme.colors.background.primary,
                padding: '8px',
                position: 'relative',
                alignItems: 'center',
                marginTop: '5px',
                marginBottom: '5px'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{ width: '100%', marginRight: '10px' }}>
                {children}
            </div>
            <div 
                className={css`
                    display: flex;
                    justify-items: center;
                    opacity: ${isHovered && isIcon ? 1 : 0}; 
                    transition: opacity 0.3s ease-in-out;
                `}
            >
                <IconButton 
                    size='xl' 
                    name={icon??'trash-alt'} 
                    aria-label={icon??'trash-alt'} 
                    onClick={onDelete}
                />
            </div>
        </div>
    );
};

export default RuleInputWrapper;