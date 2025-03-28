import React, { useState, useRef, useEffect } from 'react';
import { Badge, MenuGroup, Text, useTheme2 } from '@grafana/ui';
import { customHtmlBase } from 'types/types';
import { css } from '@emotion/css';

interface StringListProps extends customHtmlBase{
  label: string;
  content: string[] | undefined;
}

const StringList: React.FC<StringListProps> = ({ label, content, labelSize = 'span', textSize = 'span', bgColor = useTheme2().colors.success.main}, color = 'black') => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visibleStrings, setVisibleStrings] = useState<string[]>([]); 
  const [remainingCount, setRemainingCount] = useState<number>(0);

  // Helper function to calculate text width
  const getTextWidth = (text: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.font = '14px Arial';
    return context.measureText(text).width + 20; // Add padding for divs
  };

  // Function to calculate visible strings based on container width
  const calculateVisibleStrings = () => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    let totalWidth = 0;
    let visible: string[] = [];
    let remaining = 0;

    // Account for the "+X more" element's width
    const moreItemWidth = 80; // Approximate width for "+X more" element
    const availableWidth = containerWidth - moreItemWidth;
    if(content!==undefined){
      if(content.length === 0){
        const str = 'none';
        const strWidth = getTextWidth(str)
  
        if (totalWidth + strWidth <= availableWidth) {
          visible.push(str);
          totalWidth += strWidth + 5; // Add gap width (5px)
        }
      }else{
        for (let i = 0; i < content.length; i++) {
          const str = content[i];
          const strWidth = getTextWidth(str);
          
          // Check if this string would fit
          if (totalWidth + strWidth <= availableWidth) {
            visible.push(str);
            totalWidth += strWidth + 5; // Add gap width (5px)
          } else {
            remaining = content.length - i;
            break;
          }
        }
      }
    }else{
      const str = 'all';
      const strWidth = getTextWidth(str)

      if (totalWidth + strWidth <= availableWidth) {
        visible.push(str);
        totalWidth += strWidth + 5; // Add gap width (5px)
      }
    }
    
    

    setVisibleStrings(visible);
    setRemainingCount(remaining);
  };

  // Initial calculation
  useEffect(() => {
    calculateVisibleStrings();
    // Add resize listener
    const handleResize = () => {
      calculateVisibleStrings();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [content]);


  return (
    <MenuGroup>
      <div style={{marginBottom: '4px'}}>
        <Text  truncate={true} element={labelSize}>{label}</Text>
      </div>
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: '5px',
          width: '100%',
          overflowX: 'hidden', 
        }}
      >
        {visibleStrings.map((str, index) => (
          <Badge color="blue" text={<Text variant={'body'}>{str}</Text>}> </Badge>
        ))}

        {remainingCount > 0 && (
          <Badge  color="blue" text={<Text variant={'body'}>{`+${remainingCount} more`}</Text>}> </Badge>
        )}
      </div>
    </MenuGroup>
  );
};

export default StringList;