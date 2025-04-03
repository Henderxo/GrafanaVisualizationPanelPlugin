import { PanelData, SelectableValue } from "@grafana/data";
import { Diagram } from "mermaid/dist/Diagram";
import { BaseObject, DiagramDBResponse, FlowClass, FlowEdge, FlowSubGraph, FlowVertex, fullMermaidMap, YamlBindRule, YamlStylingRule } from '../types';

function extractTableData(data: PanelData): Record<string, any[]>{
    return data.series[0]?.fields.reduce((acc, field) => {
    acc[field.name] = field.values.toArray();
    return acc;
  }, {} as Record<string, any[]>);
}

function mapDataToRows(data: PanelData): Record<string, any>[]{
    const tableData = extractTableData(data)
    return tableData[Object.keys(tableData)[0]].map((_, i) =>
    Object.keys(tableData).reduce((acc, key) => {
      acc[key] = tableData[key][i];
      return acc;
    }, {} as Record<string, any>))
}

  const mapToSelectableValues = (values: string[], addOptions?: string[]): SelectableValue[] => {
    let valueCopy: string[] = JSON.parse(JSON.stringify(values))
    if(addOptions){
        addOptions.reverse().forEach(option=>{
            valueCopy.unshift(option)
        })
    }
    return valueCopy.map(value => ({
      label: value,
      value: value
    }));
  };

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

function reformatDataFromResponse(rez: Diagram): {
    nodes: Map<string, FlowVertex>,
    edges: FlowEdge[],
    classes: Map<string, FlowClass>,
    subGraphs: Map<string, FlowSubGraph>
  } {
    let data: {
      nodes: Map<string, FlowVertex>,
      edges: FlowEdge[],
      classes: Map<string, FlowClass>,
      subGraphs: Map<string, FlowSubGraph>
    } = {
      nodes: new Map(),
      edges: [],
      classes: new Map(),
      subGraphs: new Map()
    };
  
    data.nodes = (rez.db as DiagramDBResponse).getVertices();
    data.classes = (rez.db as DiagramDBResponse).getClasses();
    data.edges = (rez.db as DiagramDBResponse).getEdges();

    let subGraphArray: FlowSubGraph[] = (rez.db as DiagramDBResponse).getSubGraphs();
    data.subGraphs = new Map(subGraphArray.map(item => [item.id, item]));
  
    return data;
  }

function findElementInMaps(element: string, map: fullMermaidMap) : BaseObject | null{
    if (map.nodes.has(element)) {
        return map.nodes.get(element) as BaseObject;
    }
    if (map.subGraphs.has(element)) {
        return map.subGraphs.get(element) as BaseObject;
    }
    return null;
};

function sortByPriority<T extends { priority?: number }>(arr: T[]): T[] {
    return arr.sort((a, b) => {
      const priorityA = a.priority ?? -1; 
      const priorityB = b.priority ?? -1;
  
      return priorityA - priorityB;
    });
  }

function colorToHex(color: string): string{

  if (color.startsWith('#')) {
    return color.substring(1);
  }
  
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (match) {
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    return `${r}${g}${b}`;
  }
  

  return 'D4D4D4'; 
};

  function isFlowVertex(obj: any): obj is FlowVertex {
    return (
      obj &&
      Array.isArray(obj.classes) &&
      typeof obj.id === 'string' &&
      typeof obj.domId === 'string' &&
      obj.labelType === 'text' &&
      Array.isArray(obj.styles)
    );
  }
  
  function isFlowSubGraph(obj: any): obj is FlowSubGraph {
    return (
      obj &&
      Array.isArray(obj.classes) &&
      typeof obj.id === 'string' &&
      typeof obj.title === 'string' &&
      Array.isArray(obj.nodes)
    );
  }

  function getElementTypeInBaseObject(baseObject: BaseObject): 'node' | 'subgraph' | 'unknown'{
    if (isFlowVertex(baseObject)) {
      return 'node';
    } else if (isFlowSubGraph(baseObject)) {
      return 'subgraph';
    } else {
      return 'unknown';
    }
  }

  function extractMermaidConfigString(template: string): string | undefined {
    const initRegex = /%%\{init:\s*(.*?)\s*\}%%/;
    const match = template.match(initRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return undefined;
  }

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

function findAllElementsInMaps (map: fullMermaidMap, options?: 'nodes' | 'subgraphs' | 'all'): string[] {
    let elements: string[] = [];
    if (!options || options === 'all') {
        elements = [...Array.from(map.nodes.keys()), ...Array.from(map.subGraphs.keys())];
    } else if (options === 'nodes') {
        elements = Array.from(map.nodes.keys());
    } else if (options === 'subgraphs') {
        elements = Array.from(map.subGraphs.keys());
    }
    return elements;
};

export{extractTableData, mapToSelectableValues, colorToHex,getElementsFromRule, getElementRules, extractMermaidConfigString, getElementTypeInBaseObject, mapDataToRows, findElementInMaps, findAllElementsInMaps, reformatDataFromResponse, sortByPriority}