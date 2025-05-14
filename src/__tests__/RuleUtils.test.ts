import { 
  getElementRules, 
  getElementsFromRule, 
  ruleHasElement 
} from '../utils/RuleUtils';
import { 
  FlowVertex, 
  FlowSubGraph, 
  fullMermaidMap, 
  YamlBindRule, 
  YamlStylingRule
} from '../types';

jest.mock("services/ErrorService", () => ({
  ErrorService: {
    displayError: jest.fn()
  },
  ErrorType: {
    GENERAL: "GENERAL"
  }
}));

jest.mock('../utils/DiagramMapUtils', () => {
  const original = jest.requireActual('../utils/DiagramMapUtils');
  return {
    ...original,
    findAllElementsInMaps: jest.fn()
  };
});

jest.mock('../utils/MermaidUtils', () => {
  const original = jest.requireActual('../utils/MermaidUtils');
  return {
    ...original,
    isFlowVertex: jest.fn(),
    isFlowSubGraph: jest.fn()
  };
});

jest.mock('../utils/DataBindingUtils', () => {
  const original = jest.requireActual('../utils/DataBindingUtils');
  return {
    ...original,
    bindDataToAllMapStrings: jest.fn()
  };
});

jest.mock('../utils/RuleUtils', () => {
  const actual = jest.requireActual('../utils/RuleUtils');
  return {
    ...actual,
    applyBindings: jest.fn(),
    applyStylings: jest.fn()
  };
});

describe('RuleUtils Tests', () => {
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
      labelType: 'i donno',
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

  describe('getElementRules', () => {
    it('should return binding and styling rules for a specific element', () => {
      const mockBindRules: YamlBindRule[] = [
        new YamlBindRule({ name: 'all', elements: ['all'], bindData: ['data1=value1'] }),
        new YamlBindRule({ name: 'nodes', elements: ['nodes'], bindData: ['data2=value2'] }),
        new YamlBindRule({ name: 'node1', elements: ['node1'], bindData: ['data3=value3'] }),
        new YamlBindRule({ name: 'subgraphs', elements: ['subgraphs'], bindData: ['data4=value4'] }),
        new YamlBindRule({ name: 'subgraph1', elements: ['subgraph1'], bindData: ['data5=value5'] }),
        new YamlBindRule({ name: 'node2', elements: ['node2'], bindData: ['data6=value6'] })
      ];

      const mockStylingRules: YamlStylingRule[] = [
        new YamlStylingRule({ name: 'all', elements: ['all'], applyClass: ['class1'] }),
        new YamlStylingRule({ name: 'nodes', elements: ['nodes'], applyClass: ['class2'] }),
        new YamlStylingRule({ name: 'node1', elements: ['node1'], applyClass: ['class3'] }),
        new YamlStylingRule({ name: 'subgraphs', elements: ['subgraphs'], applyClass: ['class4'] }),
        new YamlStylingRule({ name: 'subgraph1', elements: ['subgraph1'], applyClass: ['class5'] }), 
        new YamlStylingRule({ name: 'node2', elements: ['node2'], applyClass: ['class6'] })
      ];

      const nodeRules = getElementRules(mockNode, [mockBindRules, mockStylingRules]);
      expect(nodeRules.bindingRules).toHaveLength(2);
      expect(nodeRules.bindingRules).toContainEqual(mockBindRules[0]);
      expect(nodeRules.bindingRules).toContainEqual(mockBindRules[2]);
      expect(nodeRules.stylingRules).toHaveLength(2);
      expect(nodeRules.stylingRules).toContainEqual(mockStylingRules[0]);
      expect(nodeRules.stylingRules).toContainEqual(mockStylingRules[2]);

      const subgraphRules = getElementRules(mockSubgraph, [mockBindRules, mockStylingRules]);
      expect(subgraphRules.bindingRules).toHaveLength(2);
      expect(subgraphRules.bindingRules).toContainEqual(mockBindRules[0]);
      expect(subgraphRules.bindingRules).toContainEqual(mockBindRules[4]);
      expect(subgraphRules.stylingRules).toHaveLength(2);
      expect(subgraphRules.stylingRules).toContainEqual(mockStylingRules[0]);
      expect(subgraphRules.stylingRules).toContainEqual(mockStylingRules[4]);
    });
  });

  describe('getElementsFromRule', () => {
    it('should return element IDs for rules with specific elements', () => {
      const rule = new YamlBindRule({
        name: 'specificRule',
        elements: ['node1', 'subgraph1'],
        bindData: ['data=value']
      });

      const elements = getElementsFromRule(rule, mockFullMap);
      expect(elements).toContain('node1');
      expect(elements).toContain('subgraph1');
      expect(elements.length).toBe(2);
    });

    it('should return all node IDs for rules with "nodes" element', () => {
      const rule = new YamlBindRule({
        name: 'nodesRule',
        elements: ['nodes'],
        bindData: ['data=value']
      });

      const { findAllElementsInMaps } = require('../utils/DiagramMapUtils');
      findAllElementsInMaps.mockReturnValue(['node1']);

      const elements = getElementsFromRule(rule, mockFullMap);
      expect(findAllElementsInMaps).toHaveBeenCalledWith(mockFullMap, 'nodes');
      expect(elements).toContain('node1');
      expect(elements).toContain('nodes');
      expect(elements.length).toBe(2);
    });

    it('should return all subgraph IDs for rules with "subgraphs" element', () => {
      const rule = new YamlBindRule({
        name: 'subgraphsRule',
        elements: ['subgraphs'],
        bindData: ['data=value']
      });

      const { findAllElementsInMaps } = require('../utils/DiagramMapUtils');
      findAllElementsInMaps.mockReturnValue(['subgraph1']);

      const elements = getElementsFromRule(rule, mockFullMap);
      expect(findAllElementsInMaps).toHaveBeenCalledWith(mockFullMap, 'subgraphs');
      expect(elements).toContain('subgraph1');
      expect(elements).toContain('subgraphs');
      expect(elements.length).toBe(2);
    });

    it('should return all element IDs for rules with "all" element', () => {
      const rule = new YamlBindRule({
        name: 'allRule',
        elements: ['all'],
        bindData: ['data=value']
      });

      const { findAllElementsInMaps } = require('../utils/DiagramMapUtils');
      findAllElementsInMaps.mockReturnValue(['node1', 'subgraph1']);

      const elements = getElementsFromRule(rule, mockFullMap);
      expect(findAllElementsInMaps).toHaveBeenCalledWith(mockFullMap, 'all');
      expect(elements).toContain('node1');
      expect(elements).toContain('subgraph1');
      expect(elements).toContain('all');
      expect(elements.length).toBe(3);
    });

    it('should return all element IDs for rules without elements specified', () => {
      const rule = new YamlBindRule({
        name: 'noElementsRule',
        bindData: ['data=value']
      });

      const { findAllElementsInMaps } = require('../utils/DiagramMapUtils');
      findAllElementsInMaps.mockReturnValue(['node1', 'subgraph1']);

      const elements = getElementsFromRule(rule, mockFullMap);
      expect(findAllElementsInMaps).toHaveBeenCalledWith(mockFullMap);
      expect(elements).toContain('node1');
      expect(elements).toContain('subgraph1');
      expect(elements.length).toBe(2);
    });
  });

  describe('ruleHasElement', () => {
    it('should return true for rules with the specific element ID', () => {
      const rule = new YamlBindRule({ 
        name: 'specificRule',
        elements: ['node1'] 
      });
      expect(ruleHasElement(rule, mockNode)).toBe(true);
    });

    it('should return true for "all" rules with any element', () => {
      const rule = new YamlBindRule({ 
        name: 'allRule',
        elements: ['all'] 
      });
      expect(ruleHasElement(rule, mockNode)).toBe(true);
      expect(ruleHasElement(rule, mockSubgraph)).toBe(true);
    });

    it('should return true for "nodes" rules with node elements', () => {
      const rule = new YamlBindRule({ 
        name: 'nodesRule',
        elements: ['nodes'] 
      });
      
      const { isFlowVertex } = require('../utils/MermaidUtils');
      isFlowVertex.mockReturnValue(true);
      
      expect(ruleHasElement(rule, mockNode)).toBe(true);
      
      isFlowVertex.mockReturnValue(false);
      const { isFlowSubGraph } = require('../utils/MermaidUtils');
      isFlowSubGraph.mockReturnValue(true);
      
      expect(ruleHasElement(rule, mockSubgraph)).toBe(false);
    });

    it('should return true for "subgraphs" rules with subgraph elements', () => {
      const rule = new YamlBindRule({ 
        name: 'subgraphsRule',
        elements: ['subgraphs'] 
      });
      
      const { isFlowVertex } = require('../utils/MermaidUtils');
      isFlowVertex.mockReturnValue(true);
      
      expect(ruleHasElement(rule, mockNode)).toBe(false);
      
      isFlowVertex.mockReturnValue(false);
      const { isFlowSubGraph } = require('../utils/MermaidUtils');
      isFlowSubGraph.mockReturnValue(true);
      
      expect(ruleHasElement(rule, mockSubgraph)).toBe(true);
    });

    it('should return false for rules without matching elements', () => {
      const rule = new YamlBindRule({ 
        name: 'nonMatchingRule',
        elements: ['node2'] 
      });
      expect(ruleHasElement(rule, mockNode)).toBe(false);
    });

    it('should return false for rules without elements array', () => {
      const rule = new YamlBindRule({ 
        name: 'noElementsRule'
      });
      expect(ruleHasElement(rule, mockNode)).toBe(false);
    });

    it('should return false for rules with empty elements array', () => {
      const rule = new YamlBindRule({ 
        name: 'emptyElementsRule',
        elements: [] 
      });
      expect(ruleHasElement(rule, mockNode)).toBe(false);
    });
  });
});