  export interface BindingData {
    data: Record<string, any> | undefined;
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
    bindData?: string[]
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

  export interface ConditionElement {
    condition: string;
    action: Action;
  }
  
  export interface Action {
    bindData?: string[];
    applyClass?: string[];
    applyText?: string[];
  }
  
  export interface ClassStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: string;
    [key: string]: string | undefined;
  }
  

  export interface FlowEdge {
    isUserDefinedId: boolean;
    start: string;
    end: string;
    interpolate?: string;
    type?: string;
    stroke?: 'normal' | 'thick' | 'invisible' | 'dotted';
    style?: string[];
    length?: number;
    text: string;
    labelType: 'text';
    classes: string[];
    id?: string;
    animation?: 'fast' | 'slow';
    animate?: boolean;
  }

  export interface ActionData{
    bindingData: BindingData
    stylingData: StylingData[];
  }

  export interface BaseObject extends ActionData{
    id?: string
    classes: string[]
  }

  export interface FlowClass {
    id: string;
    styles: string[];
    textStyles: string[];
  }
  
  export interface FlowSubGraph extends BaseObject {
    classes: string[];
    dir?: string;
    id: string;
    labelType: string;
    nodes: string[];
    title: string;
  }
  
  export interface FlowLink {
    length?: number;
    stroke: string;
    type: string;
    text?: string;
  }

  export interface FlowVertex extends BaseObject {
    classes: string[];
    dir?: string;
    domId: string;
    haveCallback?: boolean;
    id: string;
    labelType: 'text';
    link?: string;
    linkTarget?: string;
    props?: any;
    styles: string[];
    text?: string;
    type?: FlowVertexTypeParam;
    icon?: string;
    form?: string;
    pos?: 't' | 'b';
    img?: string;
    assetWidth?: number;
    assetHeight?: number;
    defaultWidth?: number;
    imageAspectRatio?: number;
    constraint?: 'on' | 'off';
  }


  export type ArrowTypes =
  | undefined
  | 'square'
  | 'doublecircle'
  | 'circle'
  | 'ellipse'
  | 'stadium'
  | 'subroutine'
  | 'rect'
  | 'cylinder'
  | 'round'
  | 'diamond'
  | 'hexagon'
  | 'odd'
  | 'trapezoid'
  | 'inv_trapezoid'
  | 'lean_right'
  | 'lean_left';

  export type FlowVertexTypeParam =
  | undefined
  | 'square'
  | 'doublecircle'
  | 'circle'
  | 'ellipse'
  | 'stadium'
  | 'subroutine'
  | 'rect'
  | 'cylinder'
  | 'round'
  | 'diamond'
  | 'hexagon'
  | 'odd'
  | 'trapezoid'
  | 'inv_trapezoid'
  | 'lean_right'
  | 'lean_left';
  
  export interface FlowText {
    text: string;
    type: 'text';
  }


  export interface fullMermaidMap{
    nodes: Map<string, FlowVertex>, 
    edges: FlowEdge[], 
    classes:  Map<string, FlowClass>, 
    subGraphs: Map<string, FlowSubGraph>
  }