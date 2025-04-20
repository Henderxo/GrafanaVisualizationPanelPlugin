import { TypedVariableModel, VariableWithOptions } from "@grafana/data";
import { BaseObject, ConditionElement, FlowVertex, fullMermaidMap, RuleBase, YamlBindRule, YamlStylingRule } from '../types';
import { addActions } from "./ActionUtils";
import { ErrorService, ErrorType } from "services/ErrorService";
import { bindData } from "./DataBindingUtils";
import { findAllElementsInMaps, findElementInMaps, getElementTypeInBaseObject } from "./DiagramMapUtils";

    function applyAllRules (
        bindingRules: YamlBindRule[], 
        stylingRules: YamlStylingRule[], 
        fullMap: fullMermaidMap, 
        rows: Record<string, any>[], 
        grafanaVariables: TypedVariableModel[] | null
    ) {
        bindingRules.forEach(rule => {
        if (rule.function) {
            findAndApplyBindings(fullMap, rule, rows, grafanaVariables);
        } else if (rule.bindData) {
            getElementsFromRule(rule, fullMap).forEach(element => {
            let mapElement = findElementInMaps(element, fullMap);
            if (mapElement) {
                addActions({bindData: rule.bindData}, mapElement);
            }
            });
        }
        });
        
        bindData(fullMap);
        
        stylingRules.forEach(rule => {
        if (rule.function) {
            findAndApplyStyling(fullMap, rule, grafanaVariables);
        } else if (rule.applyClass||rule.applyShape||rule.applyStyle||rule.applyText) {
            getElementsFromRule(rule, fullMap).forEach(element => {
            let mapElement = findElementInMaps(element, fullMap);
            if (mapElement) {
                const action = rule.getActions().Action
                addActions(action, mapElement);
            }
            });
        }
        });
    };

  function findAndApplyBindings (
    map: fullMermaidMap, 
    rule: YamlBindRule, 
    rows: Record<string, any>[], 
    grafanaVariables: TypedVariableModel[] | null
  ) {
    rows.some((row) => {
      const actionDataList = determineAction(rule, row, grafanaVariables);
      if (actionDataList) {
        let elementList: string[] = getElementsFromRule(rule, map);
        elementList.forEach(element => {
          let elementInMap = findElementInMaps(element, map);
          if (elementInMap) {
            actionDataList.forEach(action => {
              if (action.action.bindData) {
                addActions({bindData: action.action.bindData}, elementInMap, row, grafanaVariables);
              }else{
                addActions({bindData: []}, elementInMap, row, grafanaVariables);
              }
            });
          }
        });
      }
      return actionDataList !== null;
    });
  };

  function findAndApplyStyling (
    fullMap: fullMermaidMap, 
    rule: YamlStylingRule, 
    grafanaVariables: TypedVariableModel[] | null
  ) {
    let elementList: string[] = getElementsFromRule(rule, fullMap);
    elementList.forEach(object => {
      let mapElement = findElementInMaps(object, fullMap);
      if (mapElement && mapElement.data && Object.keys(mapElement.data).length > 0) {
        const actionDataList = determineAction(rule, mapElement.data, grafanaVariables);
        if (actionDataList) {
          actionDataList.forEach(action => {
            if (action.action.bindData) {
              delete action.action.bindData;
            }
            addActions(action.action, mapElement as FlowVertex, rule);
          });
        }
      }
    });
  };

  function evaluateCondition(
      condition: string, 
      row: Record<string, any> | undefined, 
      grafanaVariables: TypedVariableModel[] | null
    ): boolean{
      try {
        if (!row) {
          return false;
        }
        const rowKeys = Object.keys(row);
        const rowValues = Object.values(row);
        
        const variableMap: Record<string, any> = {};
        if (grafanaVariables) {
          grafanaVariables.forEach((variable) => {
            variableMap[variable.name] = (variable as VariableWithOptions).current.value;
          });
        }
        
        const allKeys = [...rowKeys, ...Object.keys(variableMap)];
        const allValues = [...rowValues, ...Object.values(variableMap)];
  
        const func = new Function(...allKeys, `return ${condition};`);
        return func(...allValues);
      } catch (error) {
        ErrorService.displayError(ErrorType.GENERAL, {
          title: 'Error evaluating condition',
          message: `Failed to evaluate condition: ${condition}`,
          error: (error as Error).message
        });
        return false;
      }
    };

  function determineAction(
      rule: YamlBindRule | YamlStylingRule, 
      row: Record<string, any> | undefined, 
      grafanaVariables: TypedVariableModel[] | null
    ): ConditionElement[] | null{
      let matchedAction: ConditionElement[] = [];
      let func = rule.function;
      
      if (!func) {
        return null;
      }
      
      let valueFound = false;
      
      if (func.if && evaluateCondition(func.if.condition, row, grafanaVariables)) {
        matchedAction.push(func.if); 
        valueFound = true;
      } else if (func.else_if) {
        const elseIfArray = Array.isArray(func.else_if) ? func.else_if : [func.else_if];
        for (const elseIf of elseIfArray) {
          if (evaluateCondition(elseIf.condition, row, grafanaVariables)) {
            matchedAction.push(elseIf);
            valueFound = true;
            break;
          }
        }
      }
      
      if (func.else && !valueFound) {
        matchedAction.push({action: func.else.action, condition: 'true'});
      }
  
      return matchedAction.length > 0 ? matchedAction : null;
    };

    function getElementRules(element: BaseObject, rules: [YamlBindRule[]?, YamlStylingRule[]?]){
        const [bindRules, stylingRules] = rules;
        let elementRules: {bindingRules: YamlBindRule[], stylingRules: YamlStylingRule[]} = {bindingRules: [], stylingRules: []}
    
        const elementType = getElementTypeInBaseObject(element)
        const elementId = element.id || '';
    
        if (bindRules && element.id) {
          elementRules.bindingRules = bindRules.filter((rule) =>{
            return !rule.elements || rule.elements?.includes('all')  
            ||rule.elements?.includes('nodes') && elementType === 'node' 
            || rule.elements?.includes('subgraphs') && elementType === 'subgraph'
            || rule.elements?.includes(elementId)
          })
        }
        if (stylingRules) {
          elementRules.stylingRules = stylingRules.filter((rule) =>{
            return !rule.elements || rule.elements?.includes('all')  
            ||rule.elements?.includes('nodes') && elementType === 'node' 
            || rule.elements?.includes('subgraphs') && elementType === 'subgraph'
            || rule.elements?.includes(elementId)
          })
        }
    
        return elementRules
      }

    const getElementsFromRule = (rule: YamlBindRule | YamlStylingRule, map: fullMermaidMap): string[] => {
    let elementList: string[] = [];
    if (rule.elements) {
        rule.elements.forEach(element => {
        if (element === 'all' || element === 'nodes' || element === 'subgraphs') {
            const elementsFromMap = findAllElementsInMaps(map, element);
            elementList.push(...elementsFromMap);
        }
        elementList.push(element);
        });
    } else {
        const elementsFromMap = findAllElementsInMaps(map);
        elementList.push(...elementsFromMap);
    }
    elementList = [...new Set(elementList)];
    return elementList;
    };


    const ruleHasElement = (rule: RuleBase<any>, element: BaseObject): boolean => {
      const elementType = getElementTypeInBaseObject(element);
      const elementId = element.id || '';
      
      if (!Array.isArray(rule.elements) || rule.elements.length === 0) {
        return false;
      }
      
      if (rule.elements.includes(elementId)) {
        return true;
      }
      
      if (rule.elements.includes('all')) {
        return true;
      }
      
      if (rule.elements.includes('nodes') && elementType === 'node') {
        return true;
      }
      
      if (rule.elements.includes('subgraphs') && elementType === 'subgraph') {
        return true;
      }
      
      return false;
    };

    export {applyAllRules, getElementRules, getElementsFromRule, ruleHasElement}