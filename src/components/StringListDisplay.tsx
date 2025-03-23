import React, { useState, useRef, useEffect } from 'react';
import { MenuGroup, Text, useTheme2 } from '@grafana/ui';

interface StringListProps {
  label: string;
  content: string[];
}

const StringList: React.FC<StringListProps> = ({ label, content }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visibleStrings, setVisibleStrings] = useState<string[]>([]); // Holds visible strings
  const [remainingCount, setRemainingCount] = useState<number>(0); // Number of strings not fitting

  // Calculate how many strings fit inside the container
  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth; // Get the container's width
    let totalWidth = 0;
    let visible: string[] = [];
    let remaining = 0;

    content.forEach((str, index) => {
      const strWidth = getTextWidth(str); // Function to get text width
      totalWidth += strWidth;
      if (totalWidth < containerWidth - 100) {
        visible.push(str);
      } else {
        remaining += 1;
      }
    });

    setVisibleStrings(visible);
    setRemainingCount(remaining);
  }, [content]);

  // Helper function to calculate text width
  const getTextWidth = (text: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.font = '14px Arial'; // Use the same font as in Grafana UI
    return context.measureText(text).width + 20; // Add padding for divs
  };

  const theme = useTheme2();
  const bgColor = theme.colors.success.main;
  const shadowStyle = "0px 4px 6px rgba(0, 0, 0, 0.1)";

  return (
    <MenuGroup>
        <div style={{marginBottom: '1px'}}>
            <strong>{label} </strong>
        </div>
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '5px',
          width: '100%',
        }}
      >
        {visibleStrings.map((str, index) => (
          <div
            key={index}
            style={{
              backgroundColor: bgColor,
              color: 'black',
              padding: '5px',
              borderRadius: '5px',
              boxShadow: shadowStyle
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
              padding: '5px',
              borderRadius: '5px',
              fontWeight: 'bold',
              boxShadow: shadowStyle
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
