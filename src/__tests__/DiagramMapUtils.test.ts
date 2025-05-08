import { BaseObject, FlowVertex, FlowSubGraph, fullMermaidMap } from '../types';
import { 
  findElementInMaps, 
  getElementTypeInBaseObject, 
  findAllElementsInMaps 
} from '../utils/DiagramMapUtils';
import { isFlowVertex, isFlowSubGraph } from '../utils/MermaidUtils';

jest.mock('../utils/MermaidUtils', () => ({
  isFlowVertex: jest.fn(),
  isFlowSubGraph: jest.fn()
}));

describe('DiagramMapUtils Tests', () => {
  let mockFullMap: fullMermaidMap;
  let mockNode: FlowVertex;
  let mockSubgraph: FlowSubGraph;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockNode = {
      id: 'node1',
      domId: 'dom_node1',
      labelType: 'text',
      text: 'Node 1',
      type: 'rect',
      classes: ['node-class'],
      styles: ['fill:white', 'stroke:black'],
      data: {}
    };

    mockSubgraph = {
      id: 'subgraph1',
      title: 'Subgraph 1',
      nodes: ['node1'],
      labelType: 'text',
      classes: ['subgraph-class'],
      styles: ['fill:lightgrey'],
      data: {}
    };

    mockFullMap = {
      nodes: new Map([['node1', mockNode]]),
      subGraphs: new Map([['subgraph1', mockSubgraph]]),
      edges: [],
      classes: new Map()
    };
  });
  
  describe('findElementInMaps', () => {
    it('should find element in nodes map', () => {
      const result = findElementInMaps('node1', mockFullMap);
      expect(result).toBe(mockNode);
    });
    
    it('should find element in subGraphs map', () => {
      const result = findElementInMaps('subgraph1', mockFullMap);
      expect(result).toBe(mockSubgraph);
    });
    
    it('should return null if element is not found', () => {
      const result = findElementInMaps('nonexistent', mockFullMap);
      expect(result).toBeNull();
    });
  });
  
  describe('getElementTypeInBaseObject', () => {
    it('should identify node elements', () => {
      (isFlowVertex as unknown as jest.Mock).mockReturnValue(true);
      (isFlowSubGraph as unknown as jest.Mock).mockReturnValue(false);
      
      const result = getElementTypeInBaseObject(mockNode);
      expect(result).toBe('node');
    });
    
    it('should identify subgraph elements', () => {
      (isFlowVertex as unknown as jest.Mock).mockReturnValue(false);
      (isFlowSubGraph as unknown as jest.Mock).mockReturnValue(true);
      
      const result = getElementTypeInBaseObject(mockSubgraph);
      expect(result).toBe('subgraph');
    });
    
    it('should return unknown for unrecognized element types', () => {
      (isFlowVertex as unknown as jest.Mock).mockReturnValue(false);
      (isFlowSubGraph as unknown as jest.Mock).mockReturnValue(false);
      
      const result = getElementTypeInBaseObject({} as BaseObject);
      expect(result).toBe('unknown');
    });
  });
  
  describe('findAllElementsInMaps', () => {
    it('should return all elements when no options provided', () => {
      const result = findAllElementsInMaps(mockFullMap);
      expect(result).toContain('node1');
      expect(result).toContain('subgraph1');
      expect(result.length).toBe(2);
    });
    
    it('should return all elements when "all" option provided', () => {
      const result = findAllElementsInMaps(mockFullMap, 'all');
      expect(result).toContain('node1');
      expect(result).toContain('subgraph1');
      expect(result.length).toBe(2);
    });
    
    it('should return only nodes when "nodes" option provided', () => {
      const result = findAllElementsInMaps(mockFullMap, 'nodes');
      expect(result).toContain('node1');
      expect(result).not.toContain('subgraph1');
      expect(result.length).toBe(1);
    });
    
    it('should return only subgraphs when "subgraphs" option provided', () => {
      const result = findAllElementsInMaps(mockFullMap, 'subgraphs');
      expect(result).not.toContain('node1');
      expect(result).toContain('subgraph1');
      expect(result.length).toBe(1);
    });
  });
});