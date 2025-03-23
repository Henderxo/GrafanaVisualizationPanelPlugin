import React, { useState, useRef, useEffect } from 'react';
import { useTheme2, Grid, MenuGroup } from '@grafana/ui';
import { YamlBindRule, YamlStylingRule } from 'types/types';
import { RuleDisplay } from './RuleDisplay';

interface RuleGridProps {
  rules: YamlBindRule[] | YamlStylingRule[]; // List of rule objects to display
  height: string;
  elementHeight: string;
}

export const RuleGrid: React.FC<RuleGridProps> = ({ rules, height, elementHeight }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visibleRules, setVisibleRules] = useState<any[]>([]); // Holds rules that fit within container

  // Calculate how many rules fit inside the container
  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth; // Get the container's width
    let totalWidth = 0;
    let visible: any[] = [];

    // Loop through each rule and calculate its width
    rules.forEach((rule, index) => {
      const ruleWidth = getRuleWidth(rule); // Function to get rule width
      totalWidth += ruleWidth;
      if (totalWidth < containerWidth) {
        visible.push(rule);
      }
    });

    setVisibleRules(visible);
  }, [rules]);

  // Helper function to calculate rule width (you can define how to calculate the width of a rule)
  const getRuleWidth = (rule: any): number => {
    return 100; // Example fixed width, update according to your needs
  };

  const theme = useTheme2();

  return (
    <div style={{height: height}}>
    <MenuGroup>
    <div
        ref={containerRef}
        style={{
        display: 'grid',
        gridTemplateColumns: repeat(${elementCount}, 1fr),
        gap: '10px',
        marginTop: '10px',
        width: '100%',
        maxHeight: height,
        overflowY: 'auto', 
        }}
    >
     {visibleRules.map((rule) => (
       <RuleDisplay key={rule.id} rule={rule} height={elementHeight}/>
     ))}
   </div>
 </MenuGroup>
 </div>
  );
};

export default RuleGrid;