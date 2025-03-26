import { DiagramDB } from "mermaid/dist/diagram-api/types";

  export interface BindingData {
    data: Record<string, any> | undefined;
    priority: number;
  }

  export abstract class RuleBase<T extends RuleBase<T>> {
    id: string;
    elements?: string[];
    priority?: number;
    function?: (string | FunctionElement);
  
    constructor(data: {
      id: string;
      elements?: string[];
      priority?: number;
      function?: (string | FunctionElement);
    }) {
      this.id = data.id;
      this.elements = data.elements;
      this.priority = data.priority;
      this.function = data.function;
    }
  
    abstract getRuleType(): 'binding' | 'styling';

    // Use generic method to ensure proper type return
    clone(): T {
      const baseCloneData = {
        id: this.id,
        elements: this.elements ? [...this.elements] : undefined,
        priority: this.priority,
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
      id: string;
      elements?: string[];
      priority?: number;
      function?: (string | FunctionElement);
      bindData?: string[];
    }) {
      super(data);
      this.bindData = data.bindData;
    }
  
    getRuleType(): 'binding' | 'styling' {
      return 'binding';
    }

    // Override clone method to ensure correct typing
    clone(): YamlBindRule {
      const baseClone = super.clone();
      console.log(this)
      console.log(this.bindData)
      return new YamlBindRule({
        ...baseClone,
        bindData: this.bindData? this.bindData : undefined
      });
    }
}
  
export class YamlStylingRule extends RuleBase<YamlStylingRule> {
    applyClass?: string[];
    applyText?: string;
    applyStyle?: string[];
    applyShape?: string;
  
    constructor(data: {
      id: string;
      elements?: string[];
      priority?: number;
      function?: (string | FunctionElement);
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

    // Override clone method to ensure correct typing
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
  
  export interface YamlFunction {
    id: string;
    function: FunctionElement;
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

  export interface BaseObject{
    id?: string
    classes: string[]
    styles: string[]
    data: Record<string, any> | undefined
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

  export interface DiagramDBResponse extends DiagramDB{
    getVertices: () => Map<string, FlowVertex>
    getClasses: () => Map<string, FlowClass>
    getEdges: () => FlowEdge[];
    getSubGraphs: () => FlowSubGraph[];
    addClass(ids: string[], style: string): void;
    addLink(_start: string, _end: string, type: string): void;
    addSubGraph(_id: string, list: string[], _title: string): void;
    addVertex(id: string, textObj: object, type: string, style: string, classes2: string[], dir: string, props: object, shapeData: object): void;
    defaultConfig(): void;
    defaultStyle(): void;
    destructLink(_str: string, _startStr: string): void;
    exists(allSgs: object, _id: string): boolean;
    getAccDescription(): string;
    getAccTitle(): string;
    getData(): object;
    getDepthFirstPos(pos: number): number;
    getDiagramTitle(): string;
    getDirection(): string;
    getTooltip(id: string): string;
    indexNodes(): void;
    lex: { firstGraph: Function };
    lookUpDomId(id: string): string;
    makeUniq(sg: object, allSubgraphs: object): string;
    setAccDescription(txt: string): void;
    setClass(ids: string[], className: string): void;
    setClickEvent(ids: string[], functionName: string, functionArgs: string[]): void;
    setDirection(dir: string): void;
    setGen(ver: string): void;
    setLink(ids: string[], linkStr: string, target: string): void;
    setTooltip(ids: string[], tooltip: string): void;
    updateLink(positions: any[], style: string): void;
    updateLinkInterpolate(positions: any[], interpolate: string): void;
  }

  export interface customHtmlBase{
    labelSize?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p'
    textSize?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p';
    bgColor?: string;
    color?: string
    hover?: boolean
  }

  

  