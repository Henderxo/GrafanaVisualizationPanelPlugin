import { PanelData } from "@grafana/data";
import { BaseObject, fullMermaidMap } from "types/types";

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

function findElementInMaps(element: string, map: fullMermaidMap) : BaseObject | null{
    if (map.nodes.has(element)) {
        return map.nodes.get(element) as BaseObject;
    }
    if (map.subGraphs.has(element)) {
        return map.subGraphs.get(element) as BaseObject;
    }
    return null;
};

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

export{extractTableData, mapDataToRows, findElementInMaps, findAllElementsInMaps}