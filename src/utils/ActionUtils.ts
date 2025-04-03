import { Action, BaseObject, FlowVertex, FlowVertexTypeParam, YamlBindRule, YamlStylingRule } from "types/types";
import { bindDataToString } from "./DataBindingUtils";
import { TypedVariableModel, VariableWithOptions } from "@grafana/data";
import { isValidShape } from "./MermaidUtils";

    const applyClassAction = (Action: Action, Element: BaseObject) => {
    if (Action.applyClass) 
      Action.applyClass.forEach((className: string) => {
        const classIndex = Element.classes.indexOf(className);
        if (classIndex !== -1) {
          Element.classes.splice(classIndex, 1);
        }
        Element.classes.push(className);
      });
    }

  
    const applyStyleAction = (Action: Action, Element: BaseObject) => {
        if (Action.applyStyle) {
        Action.applyStyle.forEach((styleName: string) => {
            const [property] = styleName.split(':');
            const existingStyleIndex = Element.styles.findIndex(style => style.startsWith(property + ':'));
            if (existingStyleIndex !== -1) {
            Element.styles.splice(existingStyleIndex, 1, styleName);
            } else {
            Element.styles.push(styleName);
            }
        });
        }
    };

    const applyTextAction = (Action: Action, Element: BaseObject) => {
        if (Action.applyText) {
        const text = bindDataToString(Action.applyText, Element);
        if ('title' in Element) {
            Element.title = text;
        } else if ('text' in Element) {
            Element.text = text;
        }
        }
    };

    const applyShapeAction = (Action: Action, Element: BaseObject) => {
      if (Action.applyShape) {
        if (isValidShape(Action.applyShape)) {
          (Element as FlowVertex).type = Action.applyShape as FlowVertexTypeParam;
        }
      }
    };

    const bindDataAction = (
        Action: Action,
        Element: BaseObject,
        row?: any,
        grafanaVariables?: TypedVariableModel[] | null
    ) => {
        if (!Element.data) {
            Element.data = {};
        }
        
        if (row) {
            Element.data = {
            ...Element.data,
            ...row
            };
        }
        
        if (grafanaVariables && grafanaVariables.length > 0) {
        const variablesData: Record<string, any> = {};
        
        grafanaVariables.forEach(variable => {
            variablesData[variable.name] = (variable as VariableWithOptions).current.value;
        });
        
        Element.data = {
            ...Element.data,
            ...variablesData
        };
        }
        
        if (Action.bindData && Array.isArray(Action.bindData)) {
        Action.bindData.forEach((actionX) => {
            const [key, value] = actionX.split('=');
            Element.data = {
            ...Element.data,
            [key]: value
            };
        });
        }
    };


    const getGeneralRuleActions = (rule: YamlBindRule | YamlStylingRule): Action => {
        let tempAction: Action = {};
        
        if (rule.getRuleType() === 'binding') {
          let tempRule = { ...(rule as YamlBindRule) };
          
          if (tempRule.bindData !== undefined) {
            tempAction.bindData = tempRule.bindData;
          }
        } else {
          let tempRule = { ...(rule as YamlStylingRule) };
      
          if (tempRule.applyClass !== undefined) {
            tempAction.applyClass = tempRule.applyClass;
          }
          if (tempRule.applyStyle !== undefined) {
            tempAction.applyStyle = tempRule.applyStyle;
          }
          if (tempRule.applyShape !== undefined) {
            tempAction.applyShape = tempRule.applyShape;
          }
          if (tempRule.applyText !== undefined) {
            tempAction.applyText = tempRule.applyText;
          }
        }
      
        return tempAction;
      };

    const addActions = (
    Action: Action,
    Element: BaseObject,
    row?: any,
    grafanaVariables?: TypedVariableModel[] | null
    ) => {
    Object.keys(Action).forEach(action => {
        switch (action) {
        case "bindData":
            bindDataAction(Action, Element, row, grafanaVariables);
            break;
        case "applyClass":
            applyClassAction(Action, Element);
            break;
        case "applyStyle":
            applyStyleAction(Action, Element);
            break;
        case "applyText":
            applyTextAction(Action, Element);
            break;
        case "applyShape":
            applyShapeAction(Action, Element);
            break;
        case "applyLink":
            break;
        default:
            console.warn(`Unknown action type: ${action}`);
        }
    });
    };
  
  export {applyClassAction, getGeneralRuleActions, applyStyleAction, applyTextAction, bindDataAction, applyShapeAction, addActions}