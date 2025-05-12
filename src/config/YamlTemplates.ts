export const YAML_DEFAULT_CONFIG_TEMPLATE = `bindingRules:
  - name: Example1
    elements:
      - Example1
    bindData:
      - Text="YAML Configuration"
  - name: Example2
    elements:
      - Example2
    bindData:
      - Text="Visualization"
  - name: Example3
    elements:
      - Example3
    bindData:
      - Text="Mermaid Diagram"
  - name: Example4
    elements:
      - Example4
    bindData:
      - Text="Data"
stylingRules:
  - name: Rule_5
    elements:
      - subgraphs
    applyClass:
      - lightPurple
  - name: Rule_4
    elements:
      - nodes
    applyClass:
      - purple
`;