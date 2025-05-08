import { PanelData, SelectableValue } from "@grafana/data";
import { Diagram } from "mermaid/dist/Diagram";
import { DiagramDBResponse, FlowClass, FlowEdge, FlowSubGraph, FlowVertex} from '../types';

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

  function createRecordFromObjects<T extends Record<string, any>>(
    arr: T[],
    keyField: keyof T,
    valueField: keyof T
  ): Record<string, string> {
    return arr.reduce((acc, obj) => {
      const key = String(obj[keyField]);
      const value = String(obj[valueField]);
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
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

function sortByPriority<T extends { priority?: number }>(arr: T[]): T[] {
    return arr.sort((a, b) => {
      const priorityA = a.priority ?? -1; 
      const priorityB = b.priority ?? -1;
  
      return priorityA - priorityB;
    });
  }

export{extractTableData, mapToSelectableValues, mapDataToRows, reformatDataFromResponse, sortByPriority, createRecordFromObjects}
