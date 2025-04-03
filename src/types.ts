export * from "./types/customHtml"
export * from "./types/mermaid"
export * from "./types/rules"
import { fullMermaidMap } from "types/mermaid";

type SeriesSize = 'sm' | 'md' | 'lg';

export interface SimpleOptions {
  text: string;
  template: string;
  diagramMap: fullMermaidMap;
  diagramElements: string[];
  yamlConfig: string;
  templateForYaml: string;
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
  buttonTheme: 'primary'|'secondary'

  nodeStyles?: Record<
    string,
    { stroke: string; fill: string }
  >;
  activeView: string;
}
