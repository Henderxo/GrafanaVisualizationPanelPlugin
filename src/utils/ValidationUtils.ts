import { Action, ConditionElement, FunctionElement, RuleBase, } from "types";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationOptions {
  collectAllErrors: boolean;
}

function isNonEmptyString(value: any): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

function isDefined<T>(obj: T | null | undefined): obj is T {
  return obj !== undefined && obj !== null;
}

function isEmpty(str: string): boolean {
  return str.trim().length === 0;
}

function isNonEmptyArray<T>(value: any): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

function isObject(value: any): value is Record<string, any> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function createValidResult(): ValidationResult {
  return { isValid: true, errors: [] };
}

function createError(field: string, message: string, ): ValidationResult {
  return {
    isValid: false,
    errors: [{ field, message }]
  };
}

function mergeResults(options: ValidationOptions, ...results: ValidationResult[]): ValidationResult {
  const merged: ValidationResult = { isValid: true, errors: [] };
  
  for (const result of results) {
    if (!result.isValid) {
      merged.isValid = false;
      merged.errors = [...merged.errors, ...result.errors];
      
      if (!options.collectAllErrors && merged.errors.length > 0) {
        return merged;
      }
    }
  }
  
  return merged;
}

function validateName(rule: RuleBase<any>): ValidationResult {
  if (!isDefined(rule.name) || isEmpty(rule.name)) {
    return createError("name", "Rule name is required");
  }
  return createValidResult();
}

function validateElements(rule: RuleBase<any>): ValidationResult {
  if (isDefined(rule.elements) && !isNonEmptyArray(rule.elements)) {
    return createError("elements", "Elements must be a non-empty array");
  }
  return createValidResult();
}

function validateActions(action: Action, options: ValidationOptions, fieldPrefix: string = ""): ValidationResult {
  if (!isObject(action)) {
    return createError(`${fieldPrefix}action`, "Action must be an object");
  }

  const results: ValidationResult[] = [];

  if (isDefined(action.bindData)) {
    if (!Array.isArray(action.bindData) || action.bindData.length === 0) {
      results.push(createError(
        `${fieldPrefix}bindData`, 
        "bindData must be a non-empty array of strings"
      ));
      if (!options.collectAllErrors) return mergeResults(options, ...results);
    }
  }

  if (isDefined(action.applyClass)) {
    if (!Array.isArray(action.applyClass) ||  action.applyClass.length === 0) {
      results.push(createError(
        `${fieldPrefix}applyClass`, 
        "applyClass must be a non-empty array of strings"
      ));
      if (!options.collectAllErrors) return mergeResults(options, ...results);
    }
  }

  if (isDefined(action.applyText) && !isNonEmptyString(action.applyText)) {
    results.push(createError(
      `${fieldPrefix}applyText`, 
      "applyText must be a non-empty string"
    ));
    if (!options.collectAllErrors) return mergeResults(options, ...results);
  }

  if (isDefined(action.applyStyle)) {
    if (!Array.isArray(action.applyStyle) || action.applyStyle.length === 0) {
      results.push(createError(
        `${fieldPrefix}applyStyle`, 
        "applyStyle must be a non-empty array of strings"
      ));
      if (!options.collectAllErrors) return mergeResults(options, ...results);
    }
  }

  if (isDefined(action.applyShape) && action.applyShape.length === 0) {
    results.push(createError(
      `${fieldPrefix}applyShape`, 
      "applyShape must be a non-empty string"
    ));
    if (!options.collectAllErrors) return mergeResults(options, ...results);
  }

  return mergeResults(options, ...results);
}

function validateConditionElement(
  conditionElement: ConditionElement,
  options: ValidationOptions,
  fieldPrefix: string = "",
  ruleType: 'binding' | 'styling',
  elseFlag?: boolean
): ValidationResult {
  const results: ValidationResult[] = [];

  if (!elseFlag) {
    if (!isDefined(conditionElement.condition) || !isNonEmptyString(conditionElement.condition)) {
      results.push(createError(
        `${fieldPrefix}condition`, 
        "Condition expression is required"
      ));
      if (!options.collectAllErrors) return mergeResults(options, ...results);
    }
  }

  if (!isDefined(conditionElement.action) || (Object.keys(conditionElement.action).length === 0 && ruleType === 'styling') ) {
    results.push(createError(
      `${fieldPrefix}action`, 
      "Action is required for condition"
    ));
    if (!options.collectAllErrors) return mergeResults(options, ...results);
  } else {
    const actionResult = validateActions(conditionElement.action, options, `${fieldPrefix}action.`);
    results.push(actionResult);
    if (!options.collectAllErrors && !actionResult.isValid) return mergeResults(options, ...results);
  }

  return mergeResults(options, ...results);
}

function validateFunction(func: FunctionElement, options: ValidationOptions, ruleType: 'binding' | 'styling'): ValidationResult {
  const results: ValidationResult[] = [];

  if (!isDefined(func.if)) {
    results.push(createError("function.if", "Function requires an 'if' block"));
    if (!options.collectAllErrors) return mergeResults(options, ...results);
  } else {
    const ifResult = validateConditionElement(func.if as ConditionElement, options, "function.if.", ruleType);
    results.push(ifResult);
    if (!options.collectAllErrors && !ifResult.isValid) return mergeResults(options, ...results);
  }

  if (isDefined(func.else_if)) {
    if (!Array.isArray(func.else_if)) {
      results.push(createError("function.else_if", "else_if must be an array"));
      if (!options.collectAllErrors) return mergeResults(options, ...results);
    } else {
      for (let i = 0; i < func.else_if.length; i++) {
        const result = validateConditionElement(
          func.else_if[i], 
          options,
          `function.else_if[${i}].`,
          ruleType
        );
        results.push(result);
        if (!options.collectAllErrors && !result.isValid) return mergeResults(options, ...results);
      }
    }
  }

  if (isDefined(func.else)) {
    const result = validateConditionElement(
      func.else as ConditionElement, 
      options,
      "function.else.",
      ruleType,
      true
    );
    results.push(result);
    if (!options.collectAllErrors && !result.isValid) return mergeResults(options, ...results);
  }

  return mergeResults(options, ...results);
}

function validateGlobalActions(rule: RuleBase<any>, options: ValidationOptions): ValidationResult {
  const actionData = rule.getActions();
  if(!actionData.areActions){
    return createError("action", "Rule requires either global actions or a function block");
  }
  return validateActions(actionData.areActions?actionData.Action:{}, options);
}

export function validateRuleBase(
  rule: RuleBase<any>, 
  options: ValidationOptions = { collectAllErrors: false }
): ValidationResult {
  console.log(rule)
  const results: ValidationResult[] = [];

  const nameResult = validateName(rule);
  results.push(nameResult);
  if (!options.collectAllErrors && !nameResult.isValid) return mergeResults(options, ...results);

  const elementsResult = validateElements(rule);
  results.push(elementsResult);
  if (!options.collectAllErrors && !elementsResult.isValid) return mergeResults(options, ...results);

  if (rule.function && isDefined(rule.function) && isObject(rule.function)) {
    const funcResult = validateFunction(rule.function, options, rule.getRuleType());
    results.push(funcResult);
    if (!options.collectAllErrors && !funcResult.isValid) return mergeResults(options, ...results);
  } else {
    const actionsResult = validateGlobalActions(rule, options);
    results.push(actionsResult);
    if (!options.collectAllErrors && !actionsResult.isValid) return mergeResults(options, ...results);
  }

  return mergeResults(options, ...results);
}

export function getFieldError(result: ValidationResult, fieldName: string): string | undefined {
  const error = result.errors.find(err => 
    err.field === fieldName || err.field.startsWith(`${fieldName}.`)
  );
  return error?.message;
}
