export const  MERMAID_DEFAULT_TEMPLATE = `flowchart LR
subgraph Concept["Concept"]
      Example1["$Text"]
      Example2["$Text"]
      Example3["$Text"]
      Example4["$Text"]
end
subgraph VizBind["VizBind"]
  image@{ img: "https://github.com/Henderxo/GrafanaVisualizationPanelPlugin/blob/master/src/img/logo_png.png?raw=true", h: 200, w: 200, pos: "b"}
  Concept
end
Example3 --> Example2
Example1 --> Example2
Example4 --> Example2
image[VizBind]

classDef purple fill:#D1C4E9,stroke:#7E57C2,stroke-width:2px,color:#000000,font-weight:bold;
classDef lightPurple fill:#EDE7F6,stroke:#B39DDB,stroke-width:2px,color:#5E35B1,font-weight:bold;`