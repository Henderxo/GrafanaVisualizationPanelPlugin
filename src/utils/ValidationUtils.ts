import { Action, ConditionElement, FunctionElement, RuleBase, YamlBindRule, YamlStylingRule } from "types";

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

type ValidationResult = [boolean, string | null];

function validateName(rule: RuleBase<any>): ValidationResult {
  if (!isDefined(rule.name) || isEmpty(rule.name)) {
    return [false, "Rule name is missing or empty"];
  }
  return [true, null];
}

function validateElements(rule: RuleBase<any>): ValidationResult {
  if (isDefined(rule.elements) && !isNonEmptyArray(rule.elements)) {
    return [false, "Rule elements are defined but empty or invalid"];
  }
  return [true, null];
}

function validateActions(action: Action): ValidationResult {
  if (!isObject(action)) return [false, "Action is not an object"];

  if (
    isDefined(action.bindData) &&
    (!Array.isArray(action.bindData) || !action.bindData.every(isNonEmptyString))
  ) {
    return [false, "bindData should be a non-empty array of strings"];
  }

  if (
    isDefined(action.applyClass) &&
    (!Array.isArray(action.applyClass) || !action.applyClass.every(isNonEmptyString))
  ) {
    return [false, "applyClass should be a non-empty array of strings"];
  }

  if (isDefined(action.applyText) && !isNonEmptyString(action.applyText)) {
    return [false, "applyText should be a non-empty string"];
  }

  if (
    isDefined(action.applyStyle) &&
    (!Array.isArray(action.applyStyle) || !action.applyStyle.every(isNonEmptyString))
  ) {
    return [false, "applyStyle should be a non-empty array of strings"];
  }

  if (isDefined(action.applyShape) && !isNonEmptyString(action.applyShape)) {
    return [false, "applyShape should be a non-empty string"];
  }

  return [true, null];
}

function validateConditionElement(
  conditionElement: ConditionElement,
  elseFlag?: boolean
): ValidationResult {
  if (
    !elseFlag &&
    (!isDefined(conditionElement.condition) ||
      !isNonEmptyString(conditionElement.condition))
  ) {
    return [false, "ConditionElement has an invalid or missing condition"];
  }

  if (!isDefined(conditionElement.action)) {
    return [false, "ConditionElement is missing an action"];
  }

  const actionValidation = validateActions(conditionElement.action);
  if (!actionValidation[0]) {
    return [false, `ConditionElement action is invalid: ${actionValidation[1]}`];
  }

  return [true, null];
}

function validateFunction(func: FunctionElement): ValidationResult {
  const ifResult = validateConditionElement(func.if as ConditionElement);
  if (!ifResult[0]) return [false, `Function 'if' block invalid: ${ifResult[1]}`];

  if (isDefined(func.else_if)) {
    if (!Array.isArray(func.else_if)) {
      return [false, "Function 'else_if' must be a non-empty array"];
    }

    for (const conditionElement of func.else_if) {
      const result = validateConditionElement(conditionElement);
      if (!result[0]) return [false, `Function 'else_if' block invalid: ${result[1]}`];
    }
  }

  if (isDefined(func.else)) {
    const result = validateConditionElement(func.else as ConditionElement, true);
    if (!result[0]) return [false, `Function 'else' block invalid: ${result[1]}`];
  }

  return [true, null];
}

function validateGlobalActions(rule: RuleBase<any>): ValidationResult {
  const actionData = rule.getActions();
  if (!actionData.areActions) {
    return [false, "Rule is missing global actions"];
  }

  const result = validateActions(actionData.Action);
  if (!result[0]) return [false, `Global action invalid: ${result[1]}`];

  return [true, null];
}

function validateRuleBase(rule: RuleBase<any>): ValidationResult {
  const nameResult = validateName(rule);
  if (!nameResult[0]) return nameResult;

  const elementsResult = validateElements(rule);
  if (!elementsResult[0]) return elementsResult;

  if (rule.function && isDefined(rule.function) && isObject(rule.function)) {
    const funcResult = validateFunction(rule.function as FunctionElement);
    if (!funcResult[0]) return funcResult;
  } else {
    const actionResult = validateGlobalActions(rule);
    if (!actionResult[0]) return actionResult;
  }

  return [true, null];
}

export { validateRuleBase };
