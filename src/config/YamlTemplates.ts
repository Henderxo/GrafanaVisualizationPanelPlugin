export const YAML_DEFAULT_CONFIG_TEMPLATE = `stylingRules:
  - id: "StyleRule1"
    function:
      if:
        condition: "CPU < 50"
        action:
          applyClass: ["alert"]
      else_if:
        - condition: "CPU > 50"
          action:
            applyClass: ["warning", "inactive"]
      else:
        action:
          applyClass: ["active"]
  - id: "StyleRule2"
    elements: ["Switch_2"]
    function:
      if:
        condition: "CPU > 50"
        action:
          applyClass: ["active"]
  - id: "StyleRule3"
    elements: ["Switch_2"]
    priority: 5
    function:
      if:
        condition: "CPU > 50"
        action:
          applyClass: ["inactive"]

bindingRules:

  - id: "BindRule1"
    elements: ["nodes"]
    bindData: ["CPU=7777777777"]
    
  - id: "BindRule2"
    elements: ["Router_1", "Router_2"]
    function:
      if:
        condition: "CPU < 50"
        action:
          bindData: ["BOOM='ItExploded'"]
  - id: "BindRule3"
    elements: ["Firewall_1"]
    function:
      if:
        condition: "CPU > 50"
        action:
          bindData: []

  - id: "BindRule4"
    elements: ["Server_1", "Server_2"]
    function:
      if:
        condition: "CPU == 70"
        action:
          bindData: []

  - id: "BindRule5"
    priority: 1
    elements: ["Switch_1", "Switch_2"]
    function:
      if:
        condition: "CPU < 70"
        action:
          bindData: []

  - id: "BindRule6"
    elements: ["Switch_1"]
    function:
      if:
        condition: "CPU == 50"
        action:
          bindData: ["CPU=7784"]
`;