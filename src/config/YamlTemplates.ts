export const YAML_DEFAULT_CONFIG_TEMPLATE = `bindingRules:
  - name: ExampleBindingRule1
    elements:
      - Example1
    bindData:
      - Text="YAML Configuration"
  - name: ExampleBindingRule2
    elements:
      - Example2
    bindData:
      - Text="Visualization"
  - name: ExampleBindingRule3
    elements:
      - Example3
    bindData:
      - Text="Mermaid Diagram"
  - name: ExampleBindingRule4
    elements:
      - Example4
    bindData:
      - Text="Data"
stylingRules:
  - name: ExampleStylingRule1
    elements:
      - subgraphs
    applyClass:
      - lightPurple
  - name: ExampleStylingRule2
    elements:
      - nodes
    applyClass:
      - purple
`;