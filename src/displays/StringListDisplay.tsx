import React, { useState, useRef, useEffect } from 'react';
import { Badge, MenuGroup, Text } from '@grafana/ui';
import { customHtmlBase } from '../types';

interface StringListProps extends customHtmlBase{
  label: string;
  content: string[] | undefined;
}

const StringList: React.FC<StringListProps> = ({ label, content, labelSize = 'span'}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visibleStrings, setVisibleStrings] = useState<string[]>([]); 
  const [remainingCount, setRemainingCount] = useState<number>(0);

  const getTextWidth = (text: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return 0;
    }
    context.font = '14px Arial';
    return context.measureText(text).width + 20; 
  };

  const calculateVisibleStrings = () => {
    if (!containerRef.current) {
      return;
    }

    const containerWidth = containerRef.current.offsetWidth;
    let totalWidth = 0;
    let visible: string[] = [];
    let remaining = 0;

    const moreItemWidth = 80;
    const availableWidth = containerWidth - moreItemWidth;
    if(content!==undefined){
      if(content.length === 0){
        const str = 'none';
        const strWidth = getTextWidth(str)
  
        if (totalWidth + strWidth <= availableWidth) {
          visible.push(str);
          totalWidth += strWidth + 5;
        }
      }else{
        for (let i = 0; i < content.length; i++) {
          const str = content[i];
          const strWidth = getTextWidth(str);
          
          if (totalWidth + strWidth <= availableWidth) {
            visible.push(str);
            totalWidth += strWidth + 5;
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
        totalWidth += strWidth + 5;
      }
    }
    
    setVisibleStrings(visible);
    setRemainingCount(remaining);
  };

  useEffect(() => {
    calculateVisibleStrings();
    const handleResize = () => {
      calculateVisibleStrings();
    };
    window.addEventListener('resize', handleResize);
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
          <Badge color="blue" key={index} text={<Text variant={'body'}>{str}</Text>}> </Badge>
        ))}

        {remainingCount > 0 && (
          <Badge  color="blue" text={<Text variant={'body'}>{`+${remainingCount} more`}</Text>}> </Badge>
        )}
      </div>
    </MenuGroup>
  );
};

export default StringList;