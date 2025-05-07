import { TypedVariableModel, VariableWithOptions } from "@grafana/data";
import { 
  applyAllRules, 
  getElementRules, 
  getElementsFromRule, 
  ruleHasElement 
} from '../utils/RuleUtils';
import { 
  bindDataToAllMapStrings
} from '../utils/DataBindingUtils';
import { 
  findAllElementsInMaps
} from '../utils/DiagramMapUtils';
import { 
  isFlowVertex,
  isFlowSubGraph
} from '../utils/MermaidUtils';
import { 
  BaseObject, 
  FlowVertex, 
  FlowSubGraph, 
  fullMermaidMap, 
  YamlBindRule, 
  YamlStylingRule,
  Action,
  FlowVertexTypeParam
} from '../types';
import { ErrorService, ErrorType } from "services/ErrorService";
import { addActions, applyClassAction, applyShapeAction, applyStyleAction, applyTextAction, bindDataAction, getGeneralRuleActions } from "utils/ActionUtils";

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
  const mockGrafanaVariables: TypedVariableModel[] = [
    {
      name: 'testVar',
      type: 'custom',
      current: { value: 'testValue' },
    } as TypedVariableModel
  ];

  const mockRows = [
    { id: '1', name: 'Node 1', status: 'active' },
    { id: '2', name: 'Node 2', status: 'inactive' }
  ];

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

describe('ActionUtils Tests', () => {
    let mockElement: BaseObject;
    
    beforeEach(() => {
      mockElement = {
        id: 'test',
        classes: ['oldClass'],
        styles: ['fill:blue', 'stroke:black'],
        data: {}
      };
    });
  
    describe('applyClassAction', () => {
      it('should add new classes to element', () => {
        const action: Action = {
          applyClass: ['newClass1', 'newClass2']
        };
        
        applyClassAction(action, mockElement);
        
        expect(mockElement.classes).toContain('oldClass');
        expect(mockElement.classes).toContain('newClass1');
        expect(mockElement.classes).toContain('newClass2');
        expect(mockElement.classes.length).toBe(3);
      });
      
      it('should replace existing classes if they match', () => {
        mockElement.classes = ['class1', 'class2'];
        const action: Action = {
          applyClass: ['class1', 'class3']
        };
        
        applyClassAction(action, mockElement);
        
        expect(mockElement.classes).toContain('class1');
        expect(mockElement.classes).toContain('class2');
        expect(mockElement.classes).toContain('class3');
        expect(mockElement.classes.length).toBe(3);
      });
    });
    
    describe('applyStyleAction', () => {
      it('should add new styles to element', () => {
        const action: Action = {
          applyStyle: ['color:red', 'font-size:12px']
        };
        
        applyStyleAction(action, mockElement);
        
        expect(mockElement.styles).toContain('fill:blue');
        expect(mockElement.styles).toContain('stroke:black');
        expect(mockElement.styles).toContain('color:red');
        expect(mockElement.styles).toContain('font-size:12px');
        expect(mockElement.styles.length).toBe(4);
      });
      
      it('should replace existing styles with same property', () => {
        const action: Action = {
          applyStyle: ['fill:red', 'stroke-width:2px']
        };
        
        applyStyleAction(action, mockElement);
        
        expect(mockElement.styles).toContain('fill:red');
        expect(mockElement.styles).toContain('stroke:black');
        expect(mockElement.styles).toContain('stroke-width:2px');
        expect(mockElement.styles.length).toBe(3);
        expect(mockElement.styles).not.toContain('fill:blue');
      });
    });
    
    describe('applyTextAction', () => {
      it('should update title of elements with title property', () => {
        const elementWithTitle = {
          id: 'test',
          classes: [],
          styles: [],
          title: 'Old Title',
          data: { var1: 'value1' }
        };
        
        const action: Action = {
          applyText: 'New Title with $var1'
        };
        
        applyTextAction(action, elementWithTitle);
        
        expect(elementWithTitle.title).toBe('New Title with value1');
      });
      
      it('should update text of elements with text property', () => {
        const elementWithText = {
          id: 'test',
          classes: [],
          styles: [],
          text: 'Old Text',
          data: { var1: 'value1' }
        };
        
        const action: Action = {
          applyText: 'New Text with $var1'
        };
        
        applyTextAction(action, elementWithText);
        
        expect(elementWithText.text).toBe('New Text with value1');
      });
    });
    
    describe('applyShapeAction', () => {
      it('should update element type if shape is valid', () => {
        const flowVertex = {
          id: 'test',
          classes: [],
          styles: [],
          type: 'rect' as FlowVertexTypeParam,
          data: {}
        };
        
        const action: Action = {
          applyShape: 'circle' as FlowVertexTypeParam
        };
        
        jest.spyOn(require('../utils/MermaidUtils'), 'isValidShape').mockReturnValue(true);
        
        applyShapeAction(action, flowVertex);
        
        expect(flowVertex.type).toBe('circle');
      });
      
      it('should not update element type if shape is invalid', () => {
        const flowVertex = {
          id: 'test',
          classes: [],
          styles: [],
          type: 'rect' as FlowVertexTypeParam,
          data: {}
        };
        
        const action: Action = {
          applyShape: 'invalid-shape' as any
        };
        
        jest.spyOn(require('../utils/MermaidUtils'), 'isValidShape').mockReturnValue(false);
        
        applyShapeAction(action, flowVertex);
        
        expect(flowVertex.type).toBe('rect');
      });
    });
    
    describe('bindDataAction', () => {
      
      it('should merge provided row data into element data', () => {
        const element = {
          id: 'test',
          classes: [],
          styles: [],
          data: { existingKey: 'existingValue' }
        };
        
        const row = { rowKey: 'rowValue' };
        
        bindDataAction({}, element, row);
        
        expect(element.data).toEqual({
          existingKey: 'existingValue',
          rowKey: 'rowValue'
        });
      });
      
      it('should merge grafana variables into element data', () => {
        const element = {
          id: 'test',
          classes: [],
          styles: [],
          data: {}
        };
        
        const grafanaVariables = [
          {
            name: 'varName',
            type: 'custom',
            current: { value: 'varValue' }
          } as unknown as VariableWithOptions 
        ] as VariableWithOptions[]
        
        bindDataAction({}, element, undefined, grafanaVariables as unknown as TypedVariableModel[]);
        
        expect(element.data).toEqual({ varName: 'varValue' });
      });
      
      it('should process bindData action array', () => {
        const element = {
          id: 'test',
          classes: [],
          styles: [],
          data: { existingKey: 'existingValue' }
        };
        
        const action: Action = {
          bindData: ['key1=value1', 'key2=value2']
        };
        
        bindDataAction(action, element);
        
        expect(element.data).toEqual({
          existingKey: 'existingValue',
          key1: 'value1',
          key2: 'value2'
        });
      });
    });
    
    describe('getGeneralRuleActions', () => {
      it('should extract actions from binding rule', () => {
        const bindRule = new YamlBindRule({
          name: 'bindRule',
          bindData: ['key=value']
        });
        
        const actions = getGeneralRuleActions(bindRule);
        
        expect(actions).toEqual({ bindData: ['key=value'] });
      });
      
      it('should extract actions from styling rule', () => {
        const stylingRule = new YamlStylingRule({
          name: 'styleRule',
          applyClass: ['class1'],
          applyStyle: ['fill:red'],
          applyShape: 'circle',
          applyText: 'New Text'
        });
        
        const actions = getGeneralRuleActions(stylingRule);
        
        expect(actions).toEqual({
          applyClass: ['class1'],
          applyStyle: ['fill:red'],
          applyShape: 'circle',
          applyText: 'New Text'
        });
      });
    });
    
    describe('addActions', () => {
      
      it('should warn about unknown action types', () => {
        const action = {
          bindData: ['key=value'],
          applyLinkasdadsa: 'link' 
        } as any;
        
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        
        addActions(action, mockElement);
        
        expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown action type: applyLinkasdadsa');
        
        consoleWarnSpy.mockRestore();
      });
    });
  })
})