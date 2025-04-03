import React, { useEffect, useState, useRef } from "react";
import { Button, Modal, useTheme2 } from "@grafana/ui";
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
  const mainColor = theme.colors.background.secondary

  useEffect(()=>{
    setLocalYaml(value)
  }, [value])

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

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

    monaco.editor.onDidChangeMarkers((e) => {
      const model = editor.getModel();
      const markers = monaco.editor.getModelMarkers({ model });
      console.log("Validation Errors:", markers); 
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
    <>
      {isOpen && (
        <Modal
          className={css`
            width: 1750px;
            height: auto;
            display: flex;
            flex-direction: column;
          `}
          title="Edit YAML Configuration"
          isOpen={isOpen}
          onDismiss={() => onClose()}
        >
            <div ref={containerRef} 
              className={css`
              .monaco-editor, .monaco-editor-background, .monaco-editor .inputarea.ime-input {
                background-color: ${mainColor};
              }
              .monaco-editor .margin {
                background-color: ${mainColor};
              }
            `} 
            style={{flex: 1, minHeight: "600px", height: '60vh', width: "100%", overflow: 'auto', border: 'solid 2px', borderColor: theme.colors.border.medium, borderRadius: '10px'}} />
          <Modal.ButtonRow>
            <Button variant="destructive" onClick={() => onClose()} style={{ marginRight: "10px" }}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleSave}>
              Save
            </Button>

          </Modal.ButtonRow>
        </Modal>
      )}
    </>
  );
};
