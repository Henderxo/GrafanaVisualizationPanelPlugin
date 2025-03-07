import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { MainPanel } from 'components/MainPanel';
import { FileUploadEditor } from 'components/FileUpload';
import { CustomTextEditor } from 'components/CustomTextEditor';
import { FileExport } from 'components/FileExport';

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
      id: 'yamlConfigEditor',
      path: 'yamlConfig',
      name: 'YAML Configuration',
      description: 'Define rules for Mermaid chart in YAML format',
      editor: CustomTextEditor,
      defaultValue: `rules:
  - id: "Rule_1"
    match:
      if: 
        condition: "Datacenter == 'Kaunas'"
        bind:
          - variable: "CPU"
          - variable: "Memory"
          - variable: "Network"

  - id: "Rule_2"
    match:
      if: 
        condition: "Server == '1'"
        bind:
          - variable: "Disk"

  - id: "Rule_3"
    match:
      if: 
        condition: "Rack == '2'"
        bind:
          - variable: "Network"

  - id: "Rule_4"
    match:
      if: 
        condition: "Datacenter == 'Vilnius'"
        bind:
          - variable: "Disk"
      else_if:
        - condition: "Rack == '1'"
          bind:
            - variable: "Memory"
      else:
        bind:
          - variable: "Power"
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
      defaultValue: `graph TD
  subgraph Datacenter_Kaunas [Kaunas DC]
    subgraph Rack_2 [Rack 2]
      Server_1_2[Usage: $CPU, $Memory, $Network, $Disk]
      Server_2_2[Usage: $CPU, $Memory, $Network]
    end
    subgraph Rack_3 [Rack 3]
      Server_1_3[Usage: $CPU, $Memory, $Network, $Disk]
    end
  end

  subgraph Datacenter_Vilnius [Vilnius DC]
    subgraph Rack_1 [Rack 1]
      Server_1_1[Usage: $CPU, $Memory, $Network, $Disk]
      Server_2_1[Usage: $CPU, $Memory, $Network]
    end
  end

  Datacenter_Kaunas --> Datacenter_Vilnius
  Rack_2 --> Server_1_2
  Rack_2 --> Server_2_2
  Rack_3 --> Server_1_3
  Rack_1 --> Server_1_1
  Rack_1 --> Server_2_1
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
