export interface DiagramElement {
    row: number;
    value: string;
    type: string;
    bindData: BindData;
    stylingData: StylingData[];
    data?: Record<string, any>;
    endRow?: number;
  }
  
  export interface BindData {
    bindData: string[];
    priority: number;
  }
  
  export interface StylingData {
    class: string;
    priority: number;
  }
  
  export interface YamlBindRule {
    id: string;
    scope: string;
    type: string;
    elements: string[];
    priority: number;
    function: (string | FunctionElement)[];
  }

  export interface YamlStylingRule{
    id: string
    scope: string
    type: string
    elements?: string[]
    priority: number
    function: FunctionElement[]
  }
  
  export interface YamlFunctions {
    id: string;
    function: FunctionElement;
  }
  
  export interface FunctionElement {
    if?: ConditionElement;
    else_if?: ConditionElement[];
    else?: ConditionElement;
  }

  export class Element implements DiagramElement {
    row: number;
    value: string;
    type: string;
    bindData: BindData;
    stylingData: StylingData[];
    data?: Record<string, any>;
    endRow?: number;
  
    constructor(
      row: number = 0,
      value: string = "",
      type: string = "node",
      bindData: BindData = { bindData: [], priority: -1 },
      stylingData: StylingData[] = [],  
    ) {
      this.row = row;
      this.value = value;
      this.type = type;
      this.bindData = bindData;
      this.stylingData = stylingData;
    }
  }
  
  export interface TemplateObject {
    [key: string]: Element | Record<string, any>;
  }
  
  export interface ConditionElement {
    condition: string;
    action: Action;
  }
  
  export interface Action {
    bindData: string[];
    applyClass: string[];
    applyText: string[];
  }
  
  export interface ClassStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: string;
    [key: string]: string | undefined;
  }
  

  