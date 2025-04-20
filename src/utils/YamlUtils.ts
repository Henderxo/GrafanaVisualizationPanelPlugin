import yaml from 'js-yaml';
import { ErrorService, ErrorType } from 'services/ErrorService';
import { YamlBindRule, YamlStylingRule } from '../types';

 function convertToYaml (jsonObject: any): string {
    try {
      const cleanObject = JSON.parse(JSON.stringify(jsonObject));
      
      const yamlString = yaml.dump(cleanObject, {
        indent: 2,
        lineWidth: -1,
        noArrayIndent: false
      });
  
      return yamlString;
    } catch (error) {
      console.error('Error converting to YAML:', error);
      return '';
    }
  };

  function parseYamlConfig(yamlConfig: string): [{ bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[] }, string | null] {
    try {
      const parsed = yaml.load(yamlConfig) as any;
      
      return [{
        bindingRules: Array.isArray(parsed.bindingRules) 
          ? parsed.bindingRules.map((rule: any) => new YamlBindRule(rule)) 
          : [],
        stylingRules: Array.isArray(parsed.stylingRules) 
          ? parsed.stylingRules.map((rule: any) => new YamlStylingRule(rule)) 
          : []
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