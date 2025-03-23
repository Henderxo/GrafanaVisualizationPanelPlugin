import React, { useState, useRef, useEffect } from 'react';
import { MenuGroup, Text, useTheme2 } from '@grafana/ui';

interface StringListProps {
  label: string;
  content: string[];
}

const StringList: React.FC<StringListProps> = ({ label, content }) => {
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
  const bgColor = theme.colors.success.main;
  const shadowStyle = "0px 4px 6px rgba(0, 0, 0, 0.1)";

  return (
    <MenuGroup>
      <div style={{marginBottom: '8px'}}>
        <strong>{label}</strong>
      </div>
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexWrap: 'nowrap', // Prevent wrapping to next line
          gap: '5px',
          width: '100%',
          overflowX: 'hidden', // Hide horizontal overflow
        }}
      >
        {visibleStrings.map((str, index) => (
          <div
            key={index}
            style={{
              backgroundColor: bgColor,
              color: 'black',
              padding: '5px 8px',
              borderRadius: '5px',
              boxShadow: shadowStyle,
              whiteSpace: 'nowrap',
            }}
          >
            <Text>{str}</Text>
          </div>
        ))}

        {remainingCount > 0 && (
          <div
            style={{
              backgroundColor: bgColor,
              color: 'black',
              padding: '5px 8px',
              borderRadius: '5px',
              fontWeight: 'bold',
              boxShadow: shadowStyle,
              whiteSpace: 'nowrap',
            }}
          >
            <Text>+{remainingCount} more</Text>
          </div>
        )}
      </div>
    </MenuGroup>
  );
};

export default StringList;