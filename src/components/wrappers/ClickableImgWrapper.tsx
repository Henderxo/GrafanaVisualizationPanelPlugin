import { Text, useTheme2 } from "@grafana/ui";
import React, { ReactNode, useState } from "react";
import { customHtmlBase } from '../../types';

interface ClickableImgWrapperProps extends customHtmlBase {
    children: ReactNode
    onClick(): () => void
    label: string
}

export const ClickableImgWrapper: React.FC<ClickableImgWrapperProps> = ({children, onClick, label}) =>{
    const theme = useTheme2()
    const [isHovered, setIsHovered] = useState(false);

    const hoverStyle = isHovered ? { 
        backgroundColor: theme.colors.action.hover,
        borderColor: `${theme.colors.border.medium}80` 
    } : {};
    return (
        <div  onClick={onClick()} style={{ backgroundColor: theme.colors.background.secondary,
            borderRadius: '7px',
            border: 'solid 2px',
            borderColor: theme.colors.border.medium,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '300px',
            height: '300px',
            ...hoverStyle, 
            transition: 'all 0.3s ease',}}
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)} 
            >
            <div style={{height: '20%', display:'flex', justifyContent: 'center', alignItems:'center'}}>
                <Text element={'h4'}>{label}</Text>
            </div>
            <div style={{height: '80%', display:'flex', justifyContent: 'center', alignItems:'center'}}>
                {children}
            </div>
        </div>
    )
}