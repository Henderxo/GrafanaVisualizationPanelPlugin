import React, { useEffect, useState, useRef } from "react";
import { Button, Modal, useTheme2 } from "@grafana/ui";
import { StandardEditorProps } from "@grafana/data";
import { css } from "@emotion/css";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { configureMonacoYaml } from "monaco-yaml";

interface EditorProps{
  value: string,
  onChange: (newConfig: string)=>void
  onClose: ()=>void
  isOpen: boolean
}

export const YamlEditor: React.FC<EditorProps> = ({ value, onChange, onClose, isOpen }) => {
  const [localYaml, setLocalYaml] = useState(value || "");
  const [areSuggestionsSet, setSuggestions] = useState(false)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme2()

  useEffect(()=>{
    setLocalYaml(value)
  }, [value])

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    console.log('Idnd tmake it here yet lul')
    monaco.languages.register({ id: "yaml" });

    configureMonacoYaml(monaco, {
      enableSchemaRequest: false,
      validate: true,
      hover: true,
      completion: true,
      format: true, 
      schemas: [
        {
          fileMatch: ['*'],
          schema: {
            "type": "object",
            "properties": {
              "functions": {
                "type": "array",
                "description": "List of functions",
                "items": {
                  "type": "object",
                  "required": ["id", "function"],
                  "properties": {
                    "id": {
                      "type": "string",
                      "description": "Unique function ID"
                    },
                    "function": {
                      "type": "object",
                      "properties": {
                        "if": {
                          "type": "object",
                          "required": ["condition", "action"],
                          "properties": {
                            "condition": {
                              "type": "string",
                              "description": "Condition for if statement"
                            },
                            "action": {
                              "type": "object",
                              "required": ["bindData", "bindClass"],
                              "properties": {
                                "bindData": {
                                  "type": "array",
                                  "items": { "type": "string" },
                                  "description": "Data bindings"
                                },
                                "bindClass": {
                                  "type": "array",
                                  "items": { "type": "string" },
                                  "enum": [
                                    "active", "inactive", "highUsage", "warning", "alert", 
                                    "unknown", "highLoad", "lowDisk", "highPerformance", "lowMemory"
                                  ],
                                  "description": "Class bindings"
                                }
                              },
                              "additionalProperties": false,
                              "anyOf": [
                                { "required": ["bindData"] },
                                { "required": ["bindClass"] }
                              ]
                            }
                          },
                          "additionalProperties": false
                        },
                        "else_if": {
                          "type": "object",
                          "properties": {
                            "condition": {
                              "type": "string",
                              "description": "Condition for else if statement"
                            },
                            "action": {
                              "type": "object",
                              "required": ["bindData", "bindClass"],
                              "properties": {
                                "bindData": {
                                  "type": "array",
                                  "items": { "type": "string" },
                                  "description": "Data bindings"
                                },
                                "bindClass": {
                                  "type": "array",
                                  "items": { "type": "string" },
                                  "description": "Class bindings"
                                }
                              },
                              "additionalProperties": false,
                              "anyOf": [
                                { "required": ["bindData"] },
                                { "required": ["bindClass"] }
                              ]
                            }
                          },
                          "additionalProperties": false
                        },
                        "else": {
                          "type": "object",
                          "properties": {
                            "action": {
                              "type": "object",
                              "required": ["bindData", "bindClass"],
                              "properties": {
                                "bindData": {
                                  "type": "array",
                                  "items": { "type": "string" },
                                  "description": "Data bindings"
                                },
                                "bindClass": {
                                  "type": "array",
                                  "items": { "type": "string" },
                                  "description": "Class bindings"
                                }
                              },
                              "additionalProperties": false,
                              "anyOf": [
                                { "required": ["bindData"] },
                                { "required": ["bindClass"] }
                              ]
                            }
                          },
                          "additionalProperties": false
                        }
                      },
                      "additionalProperties": false
                    }
                  }
                }
              },
              "rules": {
                "type": "array",
                "description": "List of rules",
                "items": {
                  "type": "object",
                  "required": ["id", "match"],
                  "properties": {
                    "id": {
                      "type": "string",
                      "description": "Unique rule ID"
                    },
                    "match": {
                      "type": "object",
                      "required": ["element", "function"],
                      "properties": {
                        "element": {
                          "type": "string",
                          "description": "Element associated with the rule"
                        },
                        "function": {
                          "type": "object",
                          "properties": {
                            "if": {
                              "type": "object",
                              "required": ["condition", "action"],
                              "properties": {
                                "condition": {
                                  "type": "string",
                                  "description": "Condition for if statement"
                                },
                                "action": {
                                  "type": "object",
                                  "required": ["bindData", "bindClass"],
                                  "properties": {
                                    "bindData": {
                                      "type": "array",
                                      "items": { "type": "string" },
                                      "description": "Data bindings"
                                    },
                                    "bindClass": {
                                      "type": "array",
                                      "items": { "type": "string" },
                                      "enum": [
                                        "active", "inactive", "highUsage", "warning", "alert", 
                                        "unknown", "highLoad", "lowDisk", "highPerformance", "lowMemory"
                                      ],
                                      "description": "Class bindings"
                                    }
                                  },
                                  "additionalProperties": false,
                                  "anyOf": [
                                    { "required": ["bindData"] },
                                    { "required": ["bindClass"] }
                                  ]
                                }
                              },
                              "additionalProperties": false
                            },
                            "else_if": {
                              "type": "object",
                              "properties": {
                                "condition": {
                                  "type": "string",
                                  "description": "Condition for else if statement"
                                },
                                "action": {
                                  "type": "object",
                                  "required": ["bindData", "bindClass"],
                                  "properties": {
                                    "bindData": {
                                      "type": "array",
                                      "items": { "type": "string" },
                                      "description": "Data bindings"
                                    },
                                    "bindClass": {
                                      "type": "array",
                                      "items": { "type": "string" },
                                      "description": "Class bindings"
                                    }
                                  },
                                  "additionalProperties": false,
                                  "anyOf": [
                                    { "required": ["bindData"] },
                                    { "required": ["bindClass"] }
                                  ]
                                }
                              },
                              "additionalProperties": false
                            },
                            "else": {
                              "type": "object",
                              "properties": {
                                "action": {
                                  "type": "object",
                                  "required": ["bindData", "bindClass"],
                                  "properties": {
                                    "bindData": {
                                      "type": "array",
                                      "items": { "type": "string" },
                                      "description": "Data bindings"
                                    },
                                    "bindClass": {
                                      "type": "array",
                                      "items": { "type": "string" },
                                      "description": "Class bindings"
                                    }
                                  },
                                  "additionalProperties": false,
                                  "anyOf": [
                                    { "required": ["bindData"] },
                                    { "required": ["bindClass"] }
                                  ]
                                }
                              },
                              "additionalProperties": false
                            }
                          },
                          "additionalProperties": false
                        }
                      },
                      "additionalProperties": false
                    }
                  }
                }
              }
            },
            "additionalProperties": false
          },
          uri: "https://example.com/schema/config-schema",
        },
      ],
    });

    monaco.editor.defineTheme('customTheme', {
      base: 'vs-dark', // Can be 'vs', 'vs-dark', or 'hc-black'
      inherit: true, // Inherits tokens from the base theme
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'namespace', foreground: '4EC9B0' },
        { token: 'type.identifier', foreground: '4EC9B0' },
        { token: 'struct', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'interface', foreground: '4EC9B0' },
        { token: 'enum', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'member.operator', foreground: 'D4D4D4' },
        // Add more token rules as needed
      ],
      colors: {
        // Editor UI colors
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editor.selectionHighlightBackground': '#ADD6FF26',
        'editor.selectionBackground': '#264F78',
        'editor.wordHighlightBackground': '#575757B8',
        'editor.wordHighlightStrongBackground': '#004972B8',
        'editor.findMatchBackground': '#515C6A',
        'editor.findMatchHighlightBackground': '#EA5C0055',
        'editor.lineHighlightBackground': '#2A2D2E',
        'editorCursor.foreground': '#AEAFAD',
        'editorWhitespace.foreground': '#3B3B3B',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        'editor.lineNumberForeground': '#858585',
        'editorLineNumber.activeForeground': '#C6C6C6',
        // Add more color rules as needed
      }
    });

    monaco.editor.onDidChangeMarkers((e) => {
      const model = editor.getModel();
      const markers = monaco.editor.getModelMarkers({ model });
      console.log("Validation Errors:", markers); // You should see validation errors here
    });

    const editor = monaco.editor.create(containerRef.current, {
        value: localYaml,
        language: "yaml",
        theme: "customTheme",
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true
        },
        suggestOnTriggerCharacters: true,
        wordBasedSuggestions: 'currentDocument',
        snippetSuggestions: 'inline',
        parameterHints: { enabled: true }
      });

    editorRef.current = editor;

    editor.onDidChangeModelContent(() => {
      setLocalYaml(editor.getValue());
    });

    if(!areSuggestionsSet){
      setSuggestions(true)
      monaco.languages.registerCompletionItemProvider("yaml", {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          );
      
          const suggestions: monaco.languages.CompletionItem[] = [
            {
              label: "functions",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "functions:\n  - id: \n    function:\n      if:\n        condition: \n        action:\n          bindData: []\n          bindClass: []",
              documentation: "List of functions",
              range,
            },
            {
              label: "rules",
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: "rules:\n  - name: \n    condition: \n    action: ",
              documentation: "List of rules",
              range,
            },
            {
              label: "if",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "if:\n  condition: \n  action:\n    bindData: []\n    bindClass: []",
              documentation: "If condition for function",
              range,
            },
            {
              label: "else_if",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "else_if:\n  condition: \n  action:\n    bindData: []\n    bindClass: []",
              documentation: "Else if condition for function",
              range,
            },
            {
              label: "else",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "else:\n  action:\n    bindData: []\n    bindClass: []",
              documentation: "Else condition for function",
              range,
            },
          ];
      
          return { suggestions };
        },
      });
    }
    
      
      return () => {
        if (editorRef.current) {
          editorRef.current.dispose();
          editorRef.current = null;
        }
      };
  }, [isOpen]); 

  const handleSave = () => {
    onChange(localYaml);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%", height: '100%' }}>
      {isOpen && (
        <Modal
          className={css`
            width: 1750px;
            height: 100%;
          `}
          title="Edit YAML Configuration"
          isOpen={isOpen}
          onDismiss={() => onClose()}
        >
          <div
            className={css`
              border-radius: 8px;
              padding: 10px;
              display: flex;
              flex-direction: column;
            `}
          >
            <div ref={containerRef} className={css`
   .monaco-editor, .monaco-editor-background, .monaco-editor .inputarea.ime-input {
    background-color: ${theme.colors.background.secondary};
  }
   .monaco-editor .margin {
    background-color: ${theme.colors.background.secondary};
  }
  .monaco-editor .line-numbers {
    color: #858585;
  }
`} style={{ height: "625px", width: "100%" , borderColor: 'Background'}} />

            <Modal.ButtonRow>
            <Button variant="secondary" onClick={handleSave}>
                Save
              </Button>
              <Button variant="destructive" onClick={() => onClose()} style={{ marginRight: "10px" }}>
                Cancel
              </Button>
            </Modal.ButtonRow>
          </div>
        </Modal>
      )}
    </div>
  );
};
