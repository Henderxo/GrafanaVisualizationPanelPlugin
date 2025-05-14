import {
    validateRuleBase,
    getFieldError,
    ValidationOptions,
  } from '../utils/ValidationUtils'; 
  
  import { RuleBase, FunctionElement } from 'types';
  
  describe('validateRuleBase', () => {
    const defaultOptions: ValidationOptions = { collectAllErrors: false };
  
    const createMockRule = (overrides: Partial<RuleBase<any>>): RuleBase<any> => {
      return {
        name: 'Valid Rule',
        elements: ['element1'],
        getRuleType: () => 'styling',
        getActions: () => ({ areActions: false }),
        ...overrides,
      } as RuleBase<any>;
    };
  
    it('should return valid result for a valid rule with unconditional actions', () => {
      const rule = createMockRule({
        getActions: () => ({
          areActions: true,
          Action: {
            bindData: ['a'],
            applyClass: ['b'],
            applyText: 'hello',
            applyStyle: ['c'],
            applyShape: 'rect',
          },
        }),
      });
  
      const result = validateRuleBase(rule, defaultOptions);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  
    it('should return error if name is missing', () => {
      const rule = createMockRule({ name: '' });
  
      const result = validateRuleBase(rule);
      expect(result.isValid).toBe(false);
      expect(getFieldError(result, 'name')).toBe('Rule name is required');
    });
  
    it('should return error if elements is defined but empty', () => {
      const rule = createMockRule({ elements: [] });
  
      const result = validateRuleBase(rule);
      expect(result.isValid).toBe(false);
      expect(getFieldError(result, 'elements')).toBe('Elements must be a non-empty array');
    });
  
    it('should validate a rule with function and valid "if" condition', () => {
      const rule = createMockRule({
        function: {
          if: {
            condition: 'x > 0',
            action: {
              bindData: ['val'],
            },
          },
        } as FunctionElement,
      });
  
      const result = validateRuleBase(rule);
      expect(result.isValid).toBe(true);
    });
  
    it('should return error if function.if is missing', () => {
      const rule = createMockRule({
        function: {
        } as any,
      });
  
      const result = validateRuleBase(rule);
      expect(result.isValid).toBe(false);
      expect(getFieldError(result, 'function.if')).toBe("Function requires an 'if' block");
    });
  
    it('should return error if function.if.condition is empty', () => {
      const rule = createMockRule({
        function: {
          if: {
            condition: '',
            action: { bindData: ['a'] },
          },
        } as FunctionElement,
      });
  
      const result = validateRuleBase(rule);
      expect(result.isValid).toBe(false);
      expect(getFieldError(result, 'function.if.condition')).toBe('Condition expression is required');
    });
  
    it('should return error if unconditional actions are not provided when function is absent', () => {
      const rule = createMockRule({
      });
  
      const result = validateRuleBase(rule);
      expect(result.isValid).toBe(false);
      expect(getFieldError(result, 'action')).toBe('Rule requires either unconditional actions or a function block');
    });
  
    it('should stop on first error when collectAllErrors is false', () => {
      const rule = createMockRule({
        name: '',
        elements: [],
      });
  
      const result = validateRuleBase(rule, { collectAllErrors: false });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(1); 
    });
  
    it('should collect all errors when collectAllErrors is true', () => {
      const rule = createMockRule({
        name: '',
        elements: []
      });
  
      const result = validateRuleBase(rule, { collectAllErrors: true });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(3);
      expect(getFieldError(result, 'name')).toBeDefined();
      expect(getFieldError(result, 'elements')).toBeDefined();
      expect(getFieldError(result, 'action')).toBeDefined();
    });
  
    it('getFieldError returns undefined if field not present', () => {
      const result = {
        isValid: false,
        errors: [{ field: 'some.other', message: 'err' }],
      };
  
      expect(getFieldError(result, 'nonexistent')).toBeUndefined();
    });
  });
  