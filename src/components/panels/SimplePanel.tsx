import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import createPanZoom from 'panzoom';

interface Props extends PanelProps<SimpleOptions> {}

export const SimplePanel: React.FC<Props> = ({ data, options, width, height }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [chartDefinition, setChartDefinition] = useState('');

  // Function to generate Mermaid graph dynamically from data & template
  const generateMermaidDiagram = () => {
    if (data.series.length === 0) return 'graph TD;\n  NoData[No Data Available];';
    let diagramContent = 'graph TD;\n';
    const nodes = new Set<string>(); // Prevents duplicate nodes
    const edges = new Set<string>(); // Prevents duplicate edges

    const template = options.template || '{level1} --> {level2}';
    const placeholders = template.match(/\{(.*?)\}/g)?.map((p) => p.replace(/[{}]/g, '')) || [];
    console.log(data)
    data.series.forEach((seriesItem) => {

      const rows = seriesItem.length;
      console.log(`Number of rows: ${rows}`)
      console.log(`AllPlaceHolders:  ${placeholders} \n`)
      for (let i = 0; i < rows; i++) {
        let values: Record<string, string> = {};
        placeholders.forEach((placeholder) => {
          values[placeholder] = seriesItem.fields.find((f) => f.name === placeholder)?.values.get(i) || '';
          console.log(`PlaceHolder: ${placeholder}\tValue: ${values[placeholder]}`)
        });

        let generatedNodes: string[] = [];
        placeholders.forEach((placeholder, index) => {
          if (values[placeholder]) {
            const nodeLabel = `${placeholder}_${values[placeholder]}`;
            if (!nodes.has(nodeLabel)) {
              diagramContent += `  ${nodeLabel}["${values[placeholder]}"];\n`;
              nodes.add(nodeLabel);
            }
            generatedNodes.push(nodeLabel);
          }
        });

        for (let j = 0; j < generatedNodes.length - 1; j++) {
          const edge = `${generatedNodes[j]} --> ${generatedNodes[j + 1]}`;
          if (!edges.has(edge)) {
            diagramContent += `  ${edge};\n`;
            edges.add(edge);
          }
        }
      }
    });
    console.log(`Final diagram: \n ${diagramContent}`)
    return diagramContent;
  };

  const handleSvgDblClick = (event: MouseEvent) => {
    const clickedElement = event.target as SVGElement;
    // const nodeId = clickedElement.textContent?.trim();

    // const currentStyle = clickedElement.getAttribute('style') || '';

    // const newStyle = currentStyle.includes('fill') 
    //   ? currentStyle.replace(/fill:[^;]+/, 'fill:#FF0000')  // Change fill color to red
    //   : currentStyle + ' fill:#FF0000';

    clickedElement.setAttribute('style',  'fill:#FF0000');
  };

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });

    setChartDefinition(generateMermaidDiagram());

    if (mermaidRef.current && chartDefinition) {
      try {
        const renderId = `mermaidChart-${Date.now()}`;
        mermaid.render(renderId, chartDefinition).then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;

            const chartElement = mermaidRef.current.querySelector('svg');
            if (chartElement) {
              createPanZoom(chartElement, { maxZoom: Infinity, minZoom: 0.5, zoomSpeed: 0.1 });
              chartElement.addEventListener('dblclick', handleSvgDblClick);
            }
          }
        });
      } catch (error) {
        console.error('Mermaid rendering error:', error);
      }
    }
  }, [data, options.template]);

  return (
    <div style={{ width, height, overflow: 'auto' }}>
      <div ref={mermaidRef} className="mermaid" style={{ width: '100%', height: '100%', overflow: 'auto', minWidth: '600px', minHeight: '400px' }}></div>
    </div>
  );
};
