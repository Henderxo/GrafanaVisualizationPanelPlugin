import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { MainPanel } from 'components/panels/MainPanel';
import { CustomTextEditor } from 'components/options/CustomTextEditor';
import { RulesConfigButton } from 'components/options/RulesConfigButton';
import { YamlEditorButton } from 'components/options/YamlEditorButton';
import { FileExportButton } from 'components/options/FileExportButton';
import { FileUploadButton } from 'components/options/FileUploadButton';
import { YAML_DEFAULT_CONFIG_TEMPLATE } from 'config/YamlTemplates';
import { MERMAID_DEFAULT_TEMPLATE } from 'config/MermaidTemplates';

export const plugin = new PanelPlugin<SimpleOptions>(MainPanel).setPanelOptions((builder) => {
  return builder
    .addSelect({
      path: 'activeView',
      name: 'Active View',
      description: 'Select which panel to display',
      settings: {
        options: [
          { value: 'mainDiagram', label: 'Main Diagram' }
        ],
      },
      defaultValue: 'mainDiagram',
    }) 
    .addSelect({
      path: 'buttonTheme',
      name: 'Button theme',
      description: 'Select which theme should be used',
      settings: {
        options: [
          { value: 'primary', label: 'Primary' },
          { value: 'secondary', label: 'Secondary' },
          { value: 'vizBind', label: 'VizBind'}
        ],
      },
      defaultValue: 'primary',
    })
    .addCustomEditor({
      id: 'yamlFile',
      path: 'yamlConfig',
      category: ['YAML Configuration'],
      name: 'Upload YAML Config',
      description: 'Upload a YAML file for configuration',
      editor: FileUploadButton,
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
      editor: FileExportButton, 
      settings: {
        chartType: 'Export YAML Config'
      }
    })
    .addCustomEditor({
      id: 'elementConfigButton',
      path: 'yamlConfig',
      category: ['YAML Configuration'],
      name: 'Element Configuration',
      description: 'Configure elements in the diagram',
      editor: RulesConfigButton,
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
      defaultValue: YAML_DEFAULT_CONFIG_TEMPLATE,
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
      editor: FileUploadButton,
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
      editor: FileExportButton, 
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
      defaultValue: MERMAID_DEFAULT_TEMPLATE,
      settings:{
        rows: 10,
        placeholder: 'Enter Mermaid configuration...'
      }
    })
});
