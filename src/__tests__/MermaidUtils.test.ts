import {
    isFlowVertex,
    isFlowSubGraph,
    isValidShape,
    extractMermaidDiagramType,
    extractMermaidConfigString,
    getLineStyle,
    generateDynamicMermaidFlowchart,
  } from '../utils/MermaidUtils';
  
  import { FlowVertex, FlowEdge, FlowSubGraph, FlowClass } from '../types';
  
  describe('Utility Function Tests', () => {
    describe('isFlowVertex', () => {
      it('should return true for valid FlowVertex', () => {
        const validVertex: FlowVertex = {
          id: 'node1',
          domId: 'dom1',
          classes: [],
          styles: [],
          data: undefined,
          labelType: 'text'
        };
        expect(isFlowVertex(validVertex)).toBe(true);
      });
  
      it('should return false for invalid object', () => {
        const invalid = { id: 'x', labelType: 'text' };
        expect(isFlowVertex(invalid)).toBe(false);
      });
    });
  
    describe('isFlowSubGraph', () => {
      it('should return true for valid FlowSubGraph', () => {
        const sg: FlowSubGraph = {
          id: 'sg1',
          classes: [],
          styles: [],
          data: undefined,
          labelType: 'text',
          title: 'Subgraph',
          nodes: []
        };
        expect(isFlowSubGraph(sg)).toBe(true);
      });
  
      it('should return false for invalid object', () => {
        const invalid = { id: 'x', title: 'Invalid' };
        expect(isFlowSubGraph(invalid)).toBe(false);
      });
    });
  
    describe('isValidShape', () => {
      it('should validate known shapes', () => {
        expect(isValidShape('circle')).toBe(true);
        expect(isValidShape('lean_right')).toBe(true);
      });
  
      it('should reject unknown shapes', () => {
        expect(isValidShape('triangle')).toBe(false);
        expect(isValidShape(undefined)).toBe(false);
      });
    });
  
    describe('extractMermaidDiagramType', () => {
      it('should extract diagram type with direction', () => {
        const result = extractMermaidDiagramType('flowchart LR');
        expect(result).toBe('flowchart LR');
      });
  
      it('should default to TD if no direction provided', () => {
        const result = extractMermaidDiagramType('flowchart');
        expect(result).toBe('flowchart TD');
      });
  
      it('should return "Unknown diagram type" for invalid code', () => {
        const result = extractMermaidDiagramType('sequenceDiagram');
        expect(result).toBe('Unknown diagram type');
      });
  
      it('should remove init config before matching', () => {
        const result = extractMermaidDiagramType('%%{init: { "theme": "dark" }}%%\nflowchart TB');
        expect(result).toBe('flowchart TB');
      });
    });
  
    describe('extractMermaidConfigString', () => {
      it('should extract valid config string', () => {
        const config = extractMermaidConfigString('%%{init: { "theme": "dark" }}%%');
        expect(config).toBe('{ "theme": "dark" }');
      });
  
      it('should return undefined for missing config', () => {
        expect(extractMermaidConfigString('flowchart LR')).toBeUndefined();
      });
    });
  
    describe('getLineStyle', () => {
      it('should return appropriate styles', () => {
        expect(getLineStyle({ stroke: 'dotted' } as FlowEdge)).toBe('-.->');
        expect(getLineStyle({ stroke: 'thick' } as FlowEdge)).toBe('==>');
        expect(getLineStyle({ stroke: 'invisible' } as FlowEdge)).toBe('~~~');
        expect(getLineStyle({ stroke: 'normal', type: 'arrow_circle' } as FlowEdge)).toBe('--o');
        expect(getLineStyle({ stroke: 'normal', type: 'arrow_cross' } as FlowEdge)).toBe('--x');
        expect(getLineStyle({ stroke: 'normal', type: 'double_arrow_point' } as FlowEdge)).toBe('<-->');
        expect(getLineStyle({ stroke: 'normal', type: 'double_arrow_cross' } as FlowEdge)).toBe('x--x');
        expect(getLineStyle({ stroke: 'normal' } as FlowEdge)).toBe('-->');
      });
    });
  
    describe('generateDynamicMermaidFlowchart', () => {
      it('should generate basic Mermaid chart from minimal input', () => {
        const nodeMap = new Map<string, FlowVertex>([
          ['node1', {
            id: 'node1',
            domId: 'dom1',
            labelType: 'text',
            classes: [],
            styles: [],
            data: undefined,
            text: 'Start'
          }]
        ]);
  
        const edgeList: FlowEdge[] = [{
          isUserDefinedId: false,
          start: 'node1',
          end: 'node2',
          stroke: 'normal',
          text: 'Next',
          labelType: 'text',
          classes: []
        }];
  
        const result = generateDynamicMermaidFlowchart({
          nodes: nodeMap,
          edges: edgeList,
          classes: new Map<string, FlowClass>(),
          subGraphs: new Map<string, FlowSubGraph>(),
          type: 'flowchart TD'
        });
  
        expect(result).toContain('flowchart TD');
        expect(result).toContain('node1@{');
        expect(result).toContain('node1 -->|Next| node2');
      });
    });
  });

  it('should handle diagram type with extra spaces', () => {
    const result = extractMermaidDiagramType('   flowchart   RL   ');
    expect(result).toBe('flowchart RL');
  });
  
  it('should handle multiple lines and extract only first valid diagram line', () => {
    const input = 'flowchart TD\nsequenceDiagram';
    expect(extractMermaidDiagramType(input)).toBe('flowchart TD');
  });

  it('should return default line style for unknown stroke type', () => {
    expect(getLineStyle({ stroke: 'foo' } as unknown as FlowEdge)).toBe('-->');
  });
  
  it('should return default for undefined stroke', () => {
    expect(getLineStyle({} as FlowEdge)).toBe('-->');
  });

  it('should generate subgraphs properly', () => {
    const subGraph: FlowSubGraph = {
      id: 'sg1',
      title: 'Group 1',
      labelType: 'text',
      classes: [],
      styles: [],
      nodes: ['node1'],
      data: undefined
    };
  
    const nodeMap = new Map<string, FlowVertex>([
      ['node1', {
        id: 'node1',
        domId: 'dom1',
        labelType: 'text',
        classes: [],
        styles: [],
        data: undefined,
        text: 'Inside Subgraph'
      }]
    ]);
  
    const result = generateDynamicMermaidFlowchart({
      nodes: nodeMap,
      edges: [],
      classes: new Map<string, FlowClass>(),
      subGraphs: new Map([['sg1', subGraph]]),
      type: 'flowchart TD'
    });
  
    expect(result).toContain('subgraph sg1 [Group 1]');
  });

  it('should handle nodes with styles and classes', () => {
    const nodeMap = new Map<string, FlowVertex>([
      ['node1', {
        id: 'node1',
        domId: 'dom1',
        labelType: 'text',
        classes: ['important'],
        styles: ['fill: red'],
        text: 'Styled Node',
        data: undefined
      }]
    ]);
  
    const result = generateDynamicMermaidFlowchart({
      nodes: nodeMap,
      edges: [],
      classes: new Map<string, FlowClass>(),
      subGraphs: new Map<string, FlowSubGraph>(),
      type: 'flowchart TD'
    });
  
    expect(result).toContain('style node1 fill: red');
    expect(result).toContain('class node1 important');
  });

