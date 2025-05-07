import { BaseObject, FlowVertex, FlowSubGraph, fullMermaidMap } from '../types';
import { bindDataToAllMapStrings, bindDataToString } from '../utils/DataBindingUtils';
import { findAllElementsInMaps, findElementInMaps } from '../utils/DiagramMapUtils';

jest.mock('../utils/DiagramMapUtils', () => ({
  findAllElementsInMaps: jest.fn(),
  findElementInMaps: jest.fn()
}));

describe('DataBindingUtils Tests', () => {
  let mockFullMap: fullMermaidMap;
  let mockNode: FlowVertex;
  let mockSubgraph: FlowSubGraph;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockNode = {
      id: 'node1',
      domId: 'dom_node1',
      labelType: 'text',
      text: 'Node with $variable',
      type: 'rect',
      classes: ['node-class'],
      styles: ['fill:white', 'stroke:black'],
      data: {
        variable: 'replaced value'
      }
    };

    mockSubgraph = {
      id: 'subgraph1',
      title: 'Subgraph with $variable',
      nodes: ['node1'],
      labelType: 'text',
      classes: ['subgraph-class'],
      styles: ['fill:lightgrey'],
      data: {
        variable: 'replaced value'
      }
    };

    mockFullMap = {
      nodes: new Map([['node1', mockNode]]),
      subGraphs: new Map([['subgraph1', mockSubgraph]]),
      edges: [],
      classes: new Map()
    };
  });

  describe('bindDataToString', () => {
    it('should replace variables in string with element data', () => {
      const inputString = 'Test string with $variable and $anotherVar';
      const element: BaseObject = {
        classes: [],
        styles: [],
        data: {
          variable: 'replaced value',
          anotherVar: 42
        }
      };

      const result = bindDataToString(inputString, element);
      expect(result).toBe('Test string with replaced value and 42');
    });

    it('should keep variables unchanged if not found in element data', () => {
      const inputString = 'Test string with $variable and $unknownVar';
      const element: BaseObject = {
        classes: [],
        styles: [],
        data: {
          variable: 'replaced value'
        }
      };

      const result = bindDataToString(inputString, element);
      expect(result).toBe('Test string with replaced value and $unknownVar');
    });

    it('should return unchanged string if element has no data', () => {
      const inputString = 'Test string with $variable';
      const element: BaseObject = {
        classes: [],
        styles: [],
        data: {}
      };

      const result = bindDataToString(inputString, element);
      expect(result).toBe('Test string with $variable');
    });

    it('should return unchanged string if element data is null', () => {
      const inputString = 'Test string with $variable';
      const element: BaseObject = {
        classes: [],
        styles: [],
        data: undefined
      };

      const result = bindDataToString(inputString, element);
      expect(result).toBe('Test string with $variable');
    });

    it('should return the input string if it is empty', () => {
      const inputString = '';
      const element: BaseObject = {
        classes: [],
        styles: [],
        data: {
          variable: 'replaced value'
        }
      };

      const result = bindDataToString(inputString, element);
      expect(result).toBe('');
    });

    it('should handle null input string', () => {
      const inputString = null as unknown as string;
      const element: BaseObject = {
        classes: [],
        styles: [],
        data: {
          variable: 'replaced value'
        }
      };

      const result = bindDataToString(inputString, element);
      expect(result).toBe(inputString);
    });
  });

  describe('bindDataToAllMapStrings', () => {
    it('should process and update node text with variables', () => {
      (findAllElementsInMaps as jest.Mock).mockReturnValue(['node1']);
      
      (findElementInMaps as jest.Mock).mockReturnValue(mockNode);

      bindDataToAllMapStrings(mockFullMap);

      expect(mockNode.text).toBe('Node with replaced value');
      
      expect(findAllElementsInMaps).toHaveBeenCalledWith(mockFullMap);
      expect(findElementInMaps).toHaveBeenCalledWith('node1', mockFullMap);
    });

    it('should process and update subgraph title with variables', () => {
      (findAllElementsInMaps as jest.Mock).mockReturnValue(['subgraph1']);
      
      (findElementInMaps as jest.Mock).mockReturnValue(mockSubgraph);

      bindDataToAllMapStrings(mockFullMap);

      expect(mockSubgraph.title).toBe('Subgraph with replaced value');
      
      expect(findAllElementsInMaps).toHaveBeenCalledWith(mockFullMap);
      expect(findElementInMaps).toHaveBeenCalledWith('subgraph1', mockFullMap);
    });

    it('should process multiple elements in the map', () => {
      (findAllElementsInMaps as jest.Mock).mockReturnValue(['node1', 'subgraph1']);
      
      (findElementInMaps as jest.Mock).mockImplementation((id, map) => {
        if (id === 'node1') return mockNode;
        if (id === 'subgraph1') return mockSubgraph;
        return null;
      });

      bindDataToAllMapStrings(mockFullMap);

      expect(mockNode.text).toBe('Node with replaced value');
      expect(mockSubgraph.title).toBe('Subgraph with replaced value');
      
      expect(findAllElementsInMaps).toHaveBeenCalledWith(mockFullMap);
      expect(findElementInMaps).toHaveBeenCalledTimes(2);
    });

    it('should not modify elements without data properties', () => {
      const nodeWithoutData: FlowVertex = {
        ...mockNode,
        data: {},
        text: 'Node with $variable'
      };
      
      const subgraphWithoutData: FlowSubGraph = {
        ...mockSubgraph,
        data: {},
        title: 'Subgraph with $variable'
      };

      (findAllElementsInMaps as jest.Mock).mockReturnValue(['node1', 'subgraph1']);
      (findElementInMaps as jest.Mock).mockImplementation((id, map) => {
        if (id === 'node1') return nodeWithoutData;
        if (id === 'subgraph1') return subgraphWithoutData;
        return null;
      });

      bindDataToAllMapStrings(mockFullMap);

      expect(nodeWithoutData.text).toBe('Node with $variable');
      expect(subgraphWithoutData.title).toBe('Subgraph with $variable');
    });

    it('should not modify elements without text or title properties', () => {
      const nodeWithoutText: FlowVertex = {
        ...mockNode,
        text: undefined
      };
      
      const subgraphWithoutTitle: FlowSubGraph = {
        ...mockSubgraph,
        title: ''
      };

      (findAllElementsInMaps as jest.Mock).mockReturnValue(['node1', 'subgraph1']);
      (findElementInMaps as jest.Mock).mockImplementation((id, map) => {
        if (id === 'node1') return nodeWithoutText;
        if (id === 'subgraph1') return subgraphWithoutTitle;
        return null;
      });

      expect(() => bindDataToAllMapStrings(mockFullMap)).not.toThrow();
    });

    it('should do nothing when no elements are found', () => {
      (findAllElementsInMaps as jest.Mock).mockReturnValue([]);

      bindDataToAllMapStrings(mockFullMap);
      
      expect(findElementInMaps).not.toHaveBeenCalled();
    });
  });
});