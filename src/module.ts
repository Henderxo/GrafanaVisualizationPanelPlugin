import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { MainPanel } from 'components/panels/MainPanel';
import { FileUploadEditor } from 'components/options/FileUpload';
import { CustomTextEditor } from 'components/options/CustomTextEditor';
import { FileExport } from 'components/options/FileExport';
import { YamlEditor } from 'components/options/yamlEditor/YamlEditor';
import { RuleConfigButton } from 'components/options/RuleConfigButton';
import { YamlEditorButton } from 'components/options/yamlEditor/YamlEditorButton';

export const plugin = new PanelPlugin<SimpleOptions>(MainPanel).setPanelOptions((builder) => {
  return builder
  .addSelect({
    path: 'activeView',
    name: 'Active View',
    description: 'Select which panel to display',
    settings: {
      options: [
        { value: 'mermaid', label: 'Mermaid Chart' },
        { value: 'otherView', label: 'Other View' },
      ],
    },
    defaultValue: 'mermaid',
  }) 
  .addCustomEditor({
    id: 'elementConfigButton',
    path: 'yamlConfig',
    category: ['YAML Configuration'],
    name: 'Element Configuration',
    description: 'Configure elements in the diagram',
    editor: RuleConfigButton,
  })
  .addCustomEditor({
      id: 'yamlFile',
      path: 'yamlConfig',
      category: ['YAML Configuration'],
      name: 'Upload YAML Config',
      description: 'Upload a YAML file for configuration',
      editor: FileUploadEditor,
      settings:{
        chartType: 'Upload YAML Config'
      }
    })
    .addCustomEditor({
      id: 'yamlFileExporter',
      path: 'yamlConfig',
      category: ['YAML Configuration'],
      name: 'Export YAML Config',
      description: 'Export a YAML file for configuration',
      editor: FileExport, 
      settings: {
        chartType: 'Export YAML Config'
      }
    })
    .addCustomEditor({
      id: "yamlEditor",
      path: "yamlConfig",
      category: ['YAML Configuration'],
      name: "Edit YAML Configuration",
      description: "Opens a modal to edit YAML",
      editor: YamlEditorButton,
    })
    .addCustomEditor({
      id: 'yamlConfigEditor',
      path: 'yamlConfig',
      category: ['YAML Configuration'],
      name: 'YAML Configuration',
      description: 'Define rules for Mermaid chart in YAML format',
      editor: CustomTextEditor,
      defaultValue: `stylingRules:
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
      
      `,
      settings:{
        rows: 10,
        placeholder: 'Enter YAML configuration...'
      }
    })
    .addCustomEditor({
      id: 'mermaidFile',
      path: 'template',
      category: ['Mermaid Configuration'],
      name: 'Upload Mermaid Template',
      description: 'Upload a Mermaid (.mmd) file',
      editor: FileUploadEditor,
      settings:{
        chartType: 'Upload Mermaid Template'
      }
    })
    .addCustomEditor({
      id: 'mermaidFileExporter',
      path: 'template',
      category: ['Mermaid Configuration'],
      name: 'Export Mermaid Template',
      description: 'Export a Mermaid file for configuration',
      editor: FileExport, 
      settings: {
        chartType: 'Export Mermaid Template'
      }
    })
    .addCustomEditor({
      id: 'mermaidTemplateEditor',
      path: 'template',
      category: ['Mermaid Configuration'],
      name: 'Mermaid Template',
      description: 'Define rules for Mermaid chart to display',
      editor: CustomTextEditor,
      defaultValue: `graph TB
  subgraph DC_Kaunas [Kaunas Data Center]
    Router_1(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
    Router_2(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
    Firewall_1(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
  end

  subgraph DC_Vilnius [Vilnius Data Center]
    Switch_1(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
    Switch_2(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
    Server_1(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
    Server_2(CPU: $CPU, Memory: $Memory, Disk: $Disk, Status: $Status)
  end
  
  %% Internal connections within Kaunas
  Router_1 -->|Data Flow| Router_2
  Router_1 -->|Security Pass| Firewall_1
  Router_2 -.->|Backup| Firewall_1
  
  %% Internal connections within Vilnius
  Switch_1 -->|Replicates| Server_1
  Switch_2 -->|Replicates| Server_2
  Server_1 -.->|Backup Data| Server_2
  
  %% Cross-Datacenter Connections
  Router_1 -->|Backup| Switch_1
  Router_2 -.->|Data Sync| Switch_2
  Firewall_1 -->|Secure Tunnel| Server_1
  Server_1 -.->|Secure Replication| Server_2

  %% Miscellaneous Connections
  Switch_1 -.->|Data Transfer| Router_2
  Switch_2 -->|Monitor| Router_1
  Router_2 -->|Security Sync| Server_1
  Server_2 -.->|Backup Sync| Router_1

  %% Class Definitions
  classDef active fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,font-weight:bold;
  classDef inactive fill:#F44336,stroke:#B71C1C,stroke-width:2px,opacity:0.6;
  classDef highUsage fill:#FFEB3B,stroke:#F57C00,stroke-width:2px;
  classDef warning fill:#FF5722,stroke:#D32F2F,stroke-width:2px;
  classDef lowDisk fill:#F44336,stroke:#B71C1C,stroke-width:2px;
  classDef lowCapacity fill:#FFC107,stroke:#FF9800,stroke-width:2px;
  classDef highPerformance fill:#3F51B5,stroke:#1A237E,stroke-width:2px;
  classDef alert fill:#FF9800,stroke:#F44336,stroke-width:2px;
  classDef unknown fill:#B0BEC5,stroke:#78909C,stroke-width:2px;
`,
      settings:{
        rows: 10,
        placeholder: 'Enter Mermaid configuration...'
      }
    })
});
