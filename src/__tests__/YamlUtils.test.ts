import { parseYamlConfig, convertToYaml } from '../utils/YamlUtils';
import { YamlBindRule, YamlStylingRule } from '../types';
import { ErrorService, ErrorType } from 'services/ErrorService';

jest.mock('services/ErrorService');

describe('YamlConfigUtils', () => {
  describe('convertToYaml', () => {
    it('should convert a valid JSON object to YAML string', () => {
      const json = {
        bindingRules: [
          {
            name: 'bind1',
            bindData: ['x=1'],
            elements: ['node1']
          }
        ]
      };

      const yamlStr = convertToYaml(json);
      expect(typeof yamlStr).toBe('string');
      expect(yamlStr).toContain('bindData');
      expect(yamlStr).toContain('x=1');
    });

    it('should return empty string on conversion error', () => {
      const circular: any = {};
      circular.self = circular;

      const result = convertToYaml(circular);
      expect(result).toBe('');
    });
  });

  describe('parseYamlConfig', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should parse valid YAML with binding and styling rules', () => {
      const yamlString = `
bindingRules:
  - name: bind1
    bindData:
      - x=1
    elements:
      - node1
stylingRules:
  - name: style1
    applyClass:
      - highlight
    elements:
      - node2
`;

      const [parsedConfig, error] = parseYamlConfig(yamlString);

      expect(error).toBeNull();
      expect(parsedConfig.bindingRules).toHaveLength(1);
      expect(parsedConfig.stylingRules).toHaveLength(1);

      expect(parsedConfig.bindingRules[0]).toBeInstanceOf(YamlBindRule);
      expect(parsedConfig.stylingRules[0]).toBeInstanceOf(YamlStylingRule);
      expect(parsedConfig.bindingRules[0].bindData).toEqual(['x=1']);
      expect(parsedConfig.stylingRules[0].applyClass).toEqual(['highlight']);
    });

    it('should skip invalid rules and still parse valid ones', () => {
      const yamlString = `
bindingRules:
  - name: 
    bindData:
      - invalid
stylingRules:
  - name: styleValid
    applyClass:
      - red
    elements:
      - node3
`;

      const [parsedConfig, error] = parseYamlConfig(yamlString);
      expect(error).toBeNull();
      expect(parsedConfig.bindingRules).toHaveLength(0);
      expect(parsedConfig.stylingRules).toHaveLength(1);
    });

    it('should return error and call ErrorService on invalid YAML', () => {
      const malformedYaml = `
bindingRules
  - name: bind1
    bindData: [x=1
`;

      const [parsedConfig, error] = parseYamlConfig(malformedYaml);
      expect(parsedConfig.bindingRules).toHaveLength(0);
      expect(parsedConfig.stylingRules).toHaveLength(0);
      expect(error).not.toBeNull();
      expect(ErrorService.displayError).toHaveBeenCalledWith(ErrorType.YAML_PARSING, expect.objectContaining({
        title: 'YAML Parsing Error',
        message: 'Failed to parse YAML configuration',
        error: expect.any(String)
      }));
    });
  });
});
