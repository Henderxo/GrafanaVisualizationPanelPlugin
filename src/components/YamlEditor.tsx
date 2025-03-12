import React, { useEffect, useState, useRef } from "react";
import { Button, Modal } from "@grafana/ui";
import { StandardEditorProps } from "@grafana/data";
import { css } from "@emotion/css";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { configureMonacoYaml } from "monaco-yaml";

interface Props extends StandardEditorProps<string> {}

export const YamlEditor: React.FC<Props> = ({ value, onChange }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [localYaml, setLocalYaml] = useState(value || "");
  const [areSuggestionsSet, setSuggestions] = useState(false)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isModalOpen || !containerRef.current) return;

    console.log("Initializing Monaco Editor...");

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

    monaco.editor.onDidChangeMarkers((e) => {
      const model = editor.getModel();
      const markers = monaco.editor.getModelMarkers({ model });
      console.log("Validation Errors:", markers); // You should see validation errors here
    });

    const editor = monaco.editor.create(containerRef.current, {
        value: localYaml,
        language: "yaml",
        theme: "vs-dark",
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
  }, [isModalOpen]); // Run only when modal opens/closes

  const handleSave = () => {
    onChange(localYaml);
    setModalOpen(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Button
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
        variant="primary"
        onClick={() => setModalOpen(true)}
      >
        Edit YAML Config
      </Button>

      {isModalOpen && (
        <Modal
          className={css`
            width: 1400px;
          `}
          title="Edit YAML Configuration"
          isOpen={isModalOpen}
          onDismiss={() => setModalOpen(false)}
        >
          <div
            className={css`
              border: 2px solid grey;
              border-radius: 8px;
              padding: 20px;
              display: flex;
              flex-direction: column;
            `}
          >
            <div ref={containerRef} style={{ height: "600px", width: "100%" }} />

            <div style={{ display: "flex", flexDirection: "row-reverse", marginTop: "15px" }}>
              <Button variant="secondary" onClick={handleSave}>
                Save
              </Button>
              <Button variant="destructive" onClick={() => setModalOpen(false)} style={{ marginRight: "10px" }}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
