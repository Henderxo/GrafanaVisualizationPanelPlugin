import yaml from 'js-yaml';
import { ErrorService, ErrorType } from 'services/ErrorService';
import { YamlBindRule, YamlStylingRule } from '../types';
import { validateRuleBase, ValidationResult } from './ValidationUtils';

 function convertToYaml (jsonObject: any): string {
    try {
      const cleanObject = JSON.parse(JSON.stringify(jsonObject));
      
      const yamlString = yaml.dump(cleanObject, {
        indent: 2,
        lineWidth: -1,
        noArrayIndent: false
      });
  
      return yamlString;
    } catch (e) {
      ErrorService.displayError(ErrorType.YAML_PARSING, {
        title: 'YAML Converting Error',
        message: 'Failed to convert YAML configuration',
        error: (e as Error).message
      });
      return '';
    }
  }

  function parseYamlConfig(yamlConfig: string): [{ bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[] }, string | null] {
    try {
      const parsed = yaml.load(yamlConfig) as any;

      const bindingRules: YamlBindRule[] = [];
      const stylingRules: YamlStylingRule[] = [];
      
      if (Array.isArray(parsed.bindingRules)) {
        parsed.bindingRules.forEach((rule: any) => {
          const newRule = new YamlBindRule(rule)
          const validationResult: ValidationResult = validateRuleBase(newRule);
          if (validationResult.isValid) {
            bindingRules.push(new YamlBindRule(newRule)); 
          } else {
            console.warn(`Invalid binding rule (Name: ${rule.name || 'Unnamed'}): ${validationResult.errors[0].message}`);
          }
        });
      }

      if (Array.isArray(parsed.stylingRules)) {
        parsed.stylingRules.forEach((rule: any) => {
          const newRule = new YamlStylingRule(rule) 
          const validationResult = validateRuleBase(newRule, );
          if (validationResult.isValid) {
            stylingRules.push(new YamlStylingRule(newRule));
          } else {
            console.warn(`Invalid styling rule (Name: ${rule.name || 'Unnamed'}): ${validationResult.errors[0].message}`);
          }
        });
      }

      return [{
        bindingRules,
        stylingRules
      }, null];
    } catch (e) {
      let errorMessage = 'An unknown error occurred';
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      ErrorService.displayError(ErrorType.YAML_PARSING, {
        title: 'YAML Parsing Error',
        message: 'Failed to parse YAML configuration',
        error: (e as Error).message
      });
      
      return [{
        bindingRules: [],
        stylingRules: []
      }, errorMessage];
    }
  }
  


export {parseYamlConfig, convertToYaml}
