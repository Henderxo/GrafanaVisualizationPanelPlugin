import {
  applyAllRules,
  getElementRules,
  getElementsFromRule,
  ruleHasElement
} from '../utils/RuleUtils';
import { TypedVariableModel } from '@grafana/data';
import { addActions } from '../utils/ActionUtils';
import * as DiagramMapUtils from '../utils/DiagramMapUtils';
import * as MermaidUtils from '../utils/MermaidUtils'
import * as ErrorService from 'services/ErrorService';
import { BaseObject, FlowVertex, RuleBase, YamlBindRule, YamlStylingRule } from '../types';



jest.mock('../utils/ActionUtils', () => ({
  addActions: jest.fn()
}));

jest.mock('../services/ErrorService', () => ({
  ErrorService: {
    displayError: jest.fn(),
  },
  ErrorType: {
    GENERAL: 'GENERAL',
  },
}));

jest.mock('../utils/DiagramMapUtils', () => {
  const actual = jest.requireActual('../utils/DiagramMapUtils');
  return {
    ...actual,
    findElementInMaps: jest.fn(),
    findAllElementsInMaps: jest.fn(),
    getElementTypeInBaseObject: jest.fn(actual.getElementTypeInBaseObject),
  };
});

jest.mock('../utils/MermaidUtils', () => ({
  isFlowVertex: jest.fn(),
  isFlowSubGraph: jest.fn(),
}));


const mockFindElementInMaps = DiagramMapUtils.findElementInMaps as jest.Mock;
const mockFindAllElementsInMaps = DiagramMapUtils.findAllElementsInMaps as jest.Mock;

beforeEach(() => {
  mockFindElementInMaps.mockReset();
  mockFindAllElementsInMaps.mockReset();
});

const fullMapMock: any = {
  nodes: { n1: { id: 'n1', type: 'node' } },
  subgraphs: {},
};

const sampleRow = { someKey: 'someValue' };

const grafanaVariablesMock: TypedVariableModel[] = [
  { name: 'var1', current: { value: 'testVal' } } as any,
];

describe('applyAllRules', () => {
  it('should apply binding and styling rules', () => {
    const bindingRules: YamlBindRule[] = [
      new YamlBindRule ({ name: 'cat', bindData: ['x'], elements: ['n1'] }),
    ];

    const stylingRules: YamlStylingRule[] = [
       new YamlStylingRule({  name: 'cat', applyClass: ['highlight'], elements: ['n1'] }),
    ];

    mockFindElementInMaps.mockReturnValue(fullMapMock.nodes.n1);
    
    applyAllRules(bindingRules, stylingRules, fullMapMock, [sampleRow], grafanaVariablesMock);

    expect(addActions).toHaveBeenCalled();
  });
});

describe('getElementsFromRule', () => {
  it('should resolve "all" to all elements from the map', () => {
    const rule: YamlBindRule = { elements: ['all'] } as any;
    mockFindAllElementsInMaps.mockReturnValue(['n1', 'n2']);

    const result = getElementsFromRule(rule, fullMapMock);

    expect(result).toContain('n1');
    expect(result).toContain('n2');
  });

  it('should return all elements if rule has no elements defined', () => {
    const rule: YamlBindRule = {} as any;
    mockFindAllElementsInMaps.mockReturnValue(['n1', 'n2']);

    const result = getElementsFromRule(rule, fullMapMock);
    expect(result).toEqual(['n1', 'n2']);
  });
});

describe('ruleHasElement', () => {
  const element: any = {

    "id": "node123",
    "labelType": "text",
    "domId": "flowchart-Router_1-154",
    "styles": [],
    "classes": [
        "warning",
        "inactive"
    ],
    "text": "CPU: 7777777777, Memory: $Memory, Disk: $Disk, Status: $Status",
    "type": "round",
    "props": {},
    "data": {
        "CPU": "7777777777"
    } 
  } as BaseObject

  it('returns true for direct ID match', () => {
    const rule = { elements: ['node123'] } as any;
    expect(ruleHasElement(rule, element)).toBe(true);
  });

  it('returns true for "all"', () => {
    const rule = { elements: ['all'] } as any;
    expect(ruleHasElement(rule, element)).toBe(true);
  });

  it('returns false if no match', () => {
    const rule = { elements: ['subgraphs'] } as any;
    expect(ruleHasElement(rule, element)).toBe(false);
  });

});

describe('isFlowVertex function', () => {
  it('should return true when the object is a flow vertex', () => {
    const obj = {
      id: 'node1',
      domId: 'dom-node1',
      labelType: 'text',
      classes: ['class1'],
      styles: [],
    };
    
    // Mocking isFlowVertex behavior
    (MermaidUtils.isFlowVertex as unknown as jest.Mock).mockReturnValue(true);

    expect(MermaidUtils.isFlowVertex(obj)).toBe(true);
  });

  it('should return false when the object is not a flow vertex', () => {
    const obj = {   
      id: 'node1',
      domId: 'dom-node1',
      labelType: 'text', 
      classes: ['class1'],
      styles: ['style1'] 
    };

    // Mocking isFlowVertex behavior
    (MermaidUtils.isFlowVertex as unknown as jest.Mock).mockReturnValue(false);

    expect(MermaidUtils.isFlowVertex(obj)).toBe(false);
  });
});
