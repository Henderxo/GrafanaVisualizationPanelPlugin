import { PanelData } from "@grafana/data";
import { Diagram } from "mermaid/dist/Diagram";
import { BaseObject, DiagramDBResponse, FlowClass, FlowEdge, FlowSubGraph, FlowVertex, fullMermaidMap } from "types/types";

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

export{extractTableData, mapDataToRows, findElementInMaps, findAllElementsInMaps, reformatDataFromResponse, sortByPriority}