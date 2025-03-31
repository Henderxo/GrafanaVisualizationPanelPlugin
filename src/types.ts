import { fullMermaidMap } from "types/types";

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

  nodeStyles?: Record<
    string,
    { stroke: string; fill: string }
  >;
  activeView: string;
}
