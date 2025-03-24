import React, { useState, useRef, useEffect } from 'react';
import { MenuGroup, Text, useTheme2 } from '@grafana/ui';
import { customHtmlBase } from 'types/types';

interface StringListProps extends customHtmlBase{
  label: string;
  content: string[];
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
    if(content.length === 0){
      const str = 'All';
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

  const theme = useTheme2();
  const shadowStyle = "0px 4px 6px rgba(0, 0, 0, 0.1)";

  return (
    <MenuGroup>
      <div style={{marginBottom: '8px'}}>
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
          <div
            key={index}
            style={{
              backgroundColor: bgColor,
              color: color,
              padding: '5px 8px',
              borderRadius: '5px',
              boxShadow: shadowStyle,
              whiteSpace: 'nowrap',
            }}
          >
            <Text element={textSize} >{str}</Text>
          </div>
        ))}

        {remainingCount > 0 && (
          <div
            style={{
              backgroundColor: bgColor,
              color: color,
              padding: '5px 8px',
              borderRadius: '5px',
              fontWeight: 'bold',
              boxShadow: shadowStyle,
              whiteSpace: 'nowrap',
            }}
          >
            <Text element={textSize}>+{remainingCount} more</Text>
          </div>
        )}
      </div>
    </MenuGroup>
  );
};

export default StringList;