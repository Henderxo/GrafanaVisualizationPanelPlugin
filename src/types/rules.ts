 export interface YamlParsedConfig {
    bindingRules: YamlBindRule[], 
    stylingRules: YamlStylingRule[]
  }

  export type ActionNames = 'applyClass'|'bindData'|'applyStyle'|'applyShape'|'applyText'

  export abstract class RuleBase<T extends RuleBase<T>> {
    name: string;
    elements?: string[];

    function?: FunctionElement
  
    constructor(data: {
      name: string;
      elements?: string[];
      function?: FunctionElement
    }) {
      this.name = data.name;
      this.elements = data.elements;
      this.function = data.function;
    }

    getActions(): {Action: Action, areActions: boolean } {
      return {Action: {}, areActions: false}; 
    }
  
    abstract getRuleType(): 'binding' | 'styling';

    clone(): T {
      const baseCloneData = {
        name: this.name,
        elements: this.elements ? [...this.elements] : undefined,
        function: this.function 
          ? (typeof this.function === 'string' 
              ? this.function 
              : JSON.parse(JSON.stringify(this.function))) 
          : undefined
      };
      
      return this instanceof YamlBindRule 
        ? new YamlBindRule(baseCloneData) as T
        : new YamlStylingRule(baseCloneData) as T;
    }
}

export class YamlBindRule extends RuleBase<YamlBindRule> {
    bindData?: string[];
  
    constructor(data: {
      name: string;
      elements?: string[];
      function?: FunctionElement
      bindData?: string[];
    }) {
      super(data);
      this.bindData = data.bindData;
    }

    getActions(): {Action: Action, areActions: boolean } {
      return {
        Action: {bindData: this.bindData},
        areActions: this.bindData?true:false
      };
    }


    getRuleType(): 'binding' | 'styling' {
      return 'binding';
    }


    clone(): YamlBindRule {
      const baseClone = super.clone();
      return new YamlBindRule({
        ...baseClone,
        bindData: this.bindData? [...this.bindData] : undefined
      });
    }
}
  
export class YamlStylingRule extends RuleBase<YamlStylingRule> {
    applyClass?: string[];
    applyText?: string;
    applyStyle?: string[];
    applyShape?: string;
  
    constructor(data: {
      name: string;
      elements?: string[];
      priority?: number;
      function?: FunctionElement
      applyClass?: string[];
      applyText?: string;
      applyStyle?: string[];
      applyShape?: string;
    }) {
      super(data);
      this.applyClass = data.applyClass;
      this.applyText = data.applyText;
      this.applyStyle = data.applyStyle;
      this.applyShape = data.applyShape;
    }
  
    getRuleType(): 'binding' | 'styling' {
      return 'styling';
    }

    getActions(): {Action: Action, areActions: boolean } {
      return {
        Action: {applyClass: this.applyClass,
        applyText: this.applyText,
        applyStyle: this.applyStyle,
        applyShape: this.applyShape},

        areActions: this.applyClass||this.applyText||this.applyStyle||this.applyShape?true:false
      };
    }

    clone(): YamlStylingRule {
      const baseClone = super.clone();
      return new YamlStylingRule({
        ...baseClone,
        applyClass: this.applyClass !== undefined ? [...this.applyClass] : undefined,
        applyText: this.applyText,
        applyStyle: this.applyStyle !== undefined ? [...this.applyStyle] : undefined,
        applyShape: this.applyShape
      });
    }
}

export interface FunctionElement {
    if?: ConditionElement;
    else_if?: ConditionElement[];
    else?: {action: Action};
  }

  export interface ConditionElement {
    condition: string;
    action: Action;
  }
  
  export interface Action {
    bindData?: string[];
    applyClass?: string[];
    applyText?: string;
    applyStyle?: string[];
    applyShape?: string;
  } 