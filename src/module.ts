import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { MainPanel } from 'components/MainPanel';
import { FileUploadEditor } from 'components/FileUpload';
import { CustomTextEditor } from 'components/CustomTextEditor';
import { FileExport } from 'components/FileExport';
import { YamlEditor } from 'components/YamlEditor';

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
      id: 'yamlFile',
      path: 'yamlConfig',
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
      name: "Edit YAML Configuration",
      description: "Opens a modal to edit YAML",
      editor: YamlEditor,
    })
    .addCustomEditor({
      id: 'yamlConfigEditor',
      path: 'yamlConfig',
      name: 'YAML Configuration',
      description: 'Define rules for Mermaid chart in YAML format',
      editor: CustomTextEditor,
      defaultValue: `stylingRules:
  - id: "Rule8"
    function:
      - if:
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
  - id: "Rule8"
    elements: ["Switch_2"]
    function:
      - if:
          condition: "CPU > 50"
          action:
            applyClass: ["active"]

bindingRules:
  - id: "Rule1"
    elements: ["Router_1", "Router_2"]
    function:
      - if:
          condition: "CPU < 50"
          action:
            bindData: ["CPU=999999"]
  - id: "Rule8"
    elements: ["Firewall_1"]
    function:
      - if:
          condition: "CPU > 50"
          action:
            bindData: [""]

  - id: "Rule2"
    elements: ["Server_1", "Server_2"]
    function:
      - if:
          condition: "CPU == 70"
          action:
            bindData: [""]

  - id: "Rule8"
    elements: ["Switch_1", "Switch_2"]
    function:
      - if:
          condition: "CPU > 70"
          action:
            bindData: [""]

  - id: "Rule52"
    elements: ["Switch_1"]
    function:
      - if:
          condition: "CPU == 50"
          action:
            bindData: [""]
      
      `,
      settings:{
        rows: 5,
        placeholder: 'Enter YAML configuration...'
      }
    })
    .addCustomEditor({
      id: 'mermaidFile',
      path: 'template',
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
        rows: 5,
        placeholder: 'Enter Mermaid configuration...'
      }
    })
    .addBooleanSwitch({
      path: 'showSeriesCount',
      name: 'Show series counter',
      defaultValue: false,
    })
    .addColorPicker({
      path: 'selectedNodeStroke',
      name: 'Stroke Color',
      description: 'Change the stroke color of the selected node',
      defaultValue: '#000000',
    })
    .addColorPicker({
      path: 'selectedNodeFill',
      name: 'Fill Color',
      description: 'Change the fill color of the selected node',
      defaultValue: '#ffffff',
    })
    .addTextInput({
      path: 'selectedNodeLabel',
      name: 'Node Label',
      description: 'Label of the selected node',
      defaultValue: '',
    })
    .addRadio({
      path: 'seriesCountSize',
      defaultValue: 'sm',
      name: 'Series counter size',
      settings: {
        options: [
          {
            value: 'sm',
            label: 'Small',
          },
          {
            value: 'md',
            label: 'Medium',
          },
          {
            value: 'lg',
            label: 'Large',
          },
        ],
      },
      showIf: (config) => config.showSeriesCount,
    });
});
