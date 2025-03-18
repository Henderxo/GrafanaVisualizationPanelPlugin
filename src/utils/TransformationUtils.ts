import { PanelData } from "@grafana/data";

function extractTableData(data: PanelData): Record<string, any[]>{
    return data.series[0]?.fields.reduce((acc, field) => {
    acc[field.name] = field.values.toArray();
    return acc;
  }, {} as Record<string, any[]>);
}

function mapDataToRows(data: PanelData): Record<string, any>{
    const tableData = extractTableData(data)
    return tableData[Object.keys(tableData)[0]].map((_, i) =>
    Object.keys(tableData).reduce((acc, key) => {
      acc[key] = tableData[key][i];
      return acc;
    }, {} as Record<string, any>))
}

export{extractTableData, mapDataToRows}