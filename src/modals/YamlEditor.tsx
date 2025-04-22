import React, { useEffect, useState, useRef } from "react";
import { Button, ConfirmModal, Modal, useTheme2 } from "@grafana/ui";
import { css } from "@emotion/css";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { configureMonacoYaml } from "monaco-yaml";
import schemaData from '../config/YamlEditorSchema.json';

interface EditorProps{
  value: string,
  onChange: (newConfig: string)=>void
  onClose: ()=>void
  isOpen: boolean
}

export const YamlEditor: React.FC<EditorProps> = ({ value, onChange, onClose, isOpen }) => {
  const [localYaml, setLocalYaml] = useState(value || "");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme2()
  const completionProviderRef = useRef<monaco.IDisposable | null>(null);
  const mainColor = theme.colors.background.secondary

  const checkForErrors = () => {
    const model = editorRef.current?.getModel();

    if (!model) return false;
  
    const markers = monaco.editor.getModelMarkers({ model });

    const hasErrors = markers.some(marker => marker.severity === monaco.MarkerSeverity.Error || monaco.MarkerSeverity.Warning);
  
    return hasErrors;
  };
  

  useEffect(()=>{
    setLocalYaml(value)
  }, [value])

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    monaco.languages.register({ id: "yaml" });
    const sheme =  configureMonacoYaml(monaco, {
        enableSchemaRequest: false,
        validate: true,
        hover: true,
        completion: true,
        format: true, 
        schemas: [
          {
            fileMatch: ['*'],
            schema: schemaData,
            uri: "inmemory://schema/yaml-editor",
          },
        ],
      });
    
      monaco.editor.defineTheme('customTheme2', {
      base: theme.isDark ? 'vs-dark' : 'vs',
      inherit: true,
      rules: [
      ],
      colors: {
        'focusBorder': mainColor,
        'contrastActiveBorder': mainColor,
        'contrastBorder': mainColor,
      }
    });

    const editor = monaco.editor.create(containerRef.current, {
        value: localYaml,
        language: "yaml",
        theme: "customTheme2",
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true
        },
        stickyScroll: {enabled: false},
        suggestOnTriggerCharacters: true,
        wordBasedSuggestions: 'currentDocument',
        snippetSuggestions: 'inline',
        parameterHints: { enabled: true }
      });

    editorRef.current = editor;

    editor.onDidChangeModelContent(() => {
      setLocalYaml(editor.getValue());
    });

      return () => {
        if (editorRef.current) {
          editorRef.current.dispose();
          sheme.dispose()
          editorRef.current = null;
        }
      };
  }, [isOpen]); 

  useEffect(()=>{

    if (!isOpen) return;
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
      completionProviderRef.current = null;
    }

    const provider = monaco.languages.registerCompletionItemProvider("yaml", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        );
    
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });
    
        const suggestions: monaco.languages.CompletionItem[] = [];
    
        const isRootLevel = !textUntilPosition.includes("bindingRules:") && 
                            !textUntilPosition.includes("stylingRules:");
        
        const inBindingRules = textUntilPosition.includes("bindingRules:") && 
                              !textUntilPosition.includes("stylingRules:");
        
        const inStylingRules = textUntilPosition.includes("stylingRules:");
        
        const inFunction = textUntilPosition.includes("function:");
        
        const inIfBlock = inFunction && textUntilPosition.includes("if:");
        
        const hasIfBeforeCurrentPosition = textUntilPosition.includes("if:");
        
        const currentLine = model.getLineContent(position.lineNumber).substring(0, position.column);
        const leadingSpaces = currentLine.search(/\S|$/);
        
        if (isRootLevel || leadingSpaces === 0) {
          suggestions.push({
            label: "bindingRules",
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: "bindingRules:\n  - name: \n    elements: []\n    bindData: []",
            documentation: "Rules for binding data to elements",
            range,
          },
          {
            label: "stylingRules",
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: "stylingRules:\n  - name: \n    elements: []\n    applyClass: []",
            documentation: "Rules for styling elements",
            range,
          });
        }
        
        if (inBindingRules) {
          if (leadingSpaces === 2) {
            suggestions.push({
              label: "binding-rule",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "- name: \n    elements: []\n    bindData: []",
              documentation: "Basic binding rule template",
              range,
            },
            {
              label: "binding-function-rule",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "- name: \n    elements: []\n    function:\n      if:\n        condition: \n        action:\n          bindData: []",
              documentation: "Binding rule with conditional function",
              range,
            });
          }
          
          if (leadingSpaces === 4) {
            suggestions.push({
              label: "name",
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: "name: ",
              documentation: "Name of the binding rule",
              range,
            },
            {
              label: "elements",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "elements: []",
              documentation: "Elements this rule applies to",
              range,
            },
            {
              label: "bindData",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "bindData: []",
              documentation: "Data to bind to elements",
              range,
            },
            {
              label: "function",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "function:\n      if:\n        condition: \n        action:\n          bindData: []",
              documentation: "Conditional function for complex binding logic",
              range,
            });
          }
        }
        
        if (inStylingRules) {
          if (leadingSpaces === 2) {
            suggestions.push({
              label: "styling-rule",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "- name: \n    elements: []\n    applyClass: []",
              documentation: "Basic styling rule template with class application",
              range,
            },
            {
              label: "styling-function-rule",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "- name: \n    elements: []\n    function:\n      if:\n        condition: \n        action:\n          applyClass: []",
              documentation: "Styling rule with conditional function",
              range,
            });
          }
          
          if (leadingSpaces === 4) {
            suggestions.push({
              label: "name",
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: "name: ",
              documentation: "Name of the styling rule",
              range,
            },
            {
              label: "elements",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "elements: []",
              documentation: "Elements this rule applies to",
              range,
            },
            {
              label: "applyClass",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "applyClass: []",
              documentation: "CSS classes to apply",
              range,
            },
            {
              label: "applyText",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "applyText: \"\"",
              documentation: "Text content to apply",
              range,
            },
            {
              label: "applyStyle",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "applyStyle: []",
              documentation: "CSS styles to apply",
              range,
            },
            {
              label: "applyShape",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "applyShape: \"\"",
              documentation: "Shape to apply",
              range,
            },
            {
              label: "function",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "function:\n      if:\n        condition: \n        action:\n          ",
              documentation: "Conditional function for complex styling logic",
              range,
            });
          }
        }
        
        if (inFunction) {
          if (!hasIfBeforeCurrentPosition && leadingSpaces === 6) {
            suggestions.push({
              label: "if",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "if:\n        condition: \n        action:\n          ",
              documentation: "Condition and action to take when true",
              range,
            });
          }
          
          if (hasIfBeforeCurrentPosition && leadingSpaces === 6) {
            suggestions.push({
              label: "else_if",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "else_if:\n        - condition: \n          action:\n            ",
              documentation: "Additional conditions to check if previous are false",
              range,
            });
          }
          
          if (hasIfBeforeCurrentPosition && leadingSpaces === 6) {
            suggestions.push({
              label: "else",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "else:\n        action:\n          ",
              documentation: "Action to take if no conditions are true",
              range,
            });
          }
        }
        
        if (inIfBlock) {
          if (leadingSpaces === 8) {
            suggestions.push({
              label: "condition",
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: "condition: ",
              documentation: "Condition expression",
              range,
            },
            {
              label: "action",
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: "action:\n          ",
              documentation: "Action to take when condition is true",
              range,
            });
          }
          
          if (leadingSpaces === 10 && inBindingRules) {
            suggestions.push({
              label: "bindData",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "bindData: []",
              documentation: "Data to bind when condition is true",
              range,
            });
          }
          
          if (leadingSpaces === 10 && inStylingRules) {
            suggestions.push({
              label: "applyClass",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "applyClass: []",
              documentation: "CSS classes to apply when condition is true",
              range,
            },
            {
              label: "applyText",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "applyText: \"\"",
              documentation: "Text content to apply when condition is true",
              range,
            },
            {
              label: "applyStyle",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "applyStyle: []",
              documentation: "CSS styles to apply when condition is true",
              range,
            },
            {
              label: "applyShape",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "applyShape: \"\"",
              documentation: "Shape to apply when condition is true",
              range,
            });
          }
        }
    
        return { suggestions };
      },
      
      triggerCharacters: [
        ":",
        "-",
        " ",
        "\n" 
      ]
    });

    completionProviderRef.current = provider;

    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
        completionProviderRef.current = null;
      }
    };
  }, [isOpen])

  const handleSave = () => {
    const hasErrors = checkForErrors()
    if(hasErrors){
      setIsConfirmModalOpen(true)
    }else{
      onChange(localYaml);
    }
  };

  const handleSaveWithError = () =>{
    onChange(localYaml);
  }

  return (
    <>
      {isOpen && (
        <Modal
          className={css`
            width: 1340px;
            height: 800px;
            display: flex;
            flex-direction: column;
          `}
          title="Edit YAML Configuration"
          isOpen={isOpen}
          onDismiss={() => onClose()}
        >
          <div style={{height: 'auto'}}>
            <div  ref={containerRef} 
                className={css`
                  
                .monaco-editor, .monaco-editor-background, .monaco-editor .inputarea.ime-input {
                  background-color: ${mainColor};
                }
                .monaco-editor .margin {
                  background-color: ${mainColor};
                }
              `} 
              style={{flex: 1, height: '570px', width: "100%", overflow: 'auto', border: 'solid 2px', borderColor: theme.colors.border.medium, borderRadius: '10px'}} />
            <Modal.ButtonRow>
              <Button variant="destructive" onClick={() => onClose()} style={{ marginRight: "10px" }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save
              </Button>

            </Modal.ButtonRow>
          </div>
          
        </Modal>
      )}
      <ConfirmModal 
              modalClass={css`top: 30%;`} 
              dismissText='Cancel' 
              confirmText='Confirm' 
              body={`Are you sure you want to save this YAML config?`} 
              title={`YAML Config has errors`} 
              isOpen={isConfirmModalOpen} 
              onDismiss={() => {setIsConfirmModalOpen(false)}} 
              onConfirm={() => {handleSaveWithError(); setIsConfirmModalOpen(false)}}
            />
    </>
  );
};
