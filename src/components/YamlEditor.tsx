import React, { useEffect, useState } from "react";
import { Button, Modal, CodeEditor } from "@grafana/ui";
import { StandardEditorProps } from "@grafana/data";
import { css } from "@emotion/css";
import * as monaco from 'monaco-editor';
interface Props extends StandardEditorProps<string> {}

export const YamlEditor: React.FC<Props> = ({ value, onChange }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [localYaml, setLocalYaml] = useState(value || "");

  const handleSave = () => {
    onChange(localYaml);
    setModalOpen(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Button style={{ width: '100%', display: 'flex', justifyContent: 'center' }} variant="primary" onClick={() => setModalOpen(true)}>
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

            <CodeEditor
            value={localYaml}
            language="yaml"
            height="600px"
            monacoOptions={{
                theme: 'vs-dark',
                automaticLayout: true,
                scrollBeyondLastLine: false, 
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnCommitCharacter: true
            }}
            onEditorDidMount={(editor, monaco) => {
                monaco.editor.setTheme('vs-dark')
            }}
            onSave={handleSave}
            onBlur={(value) => setLocalYaml(value)}
            />      

            {/* <Editor
              value={localYaml}
              language="yaml"
              height="600px"
              theme="vs-dark"
              options={{
                automaticLayout: true,
                scrollBeyondLastLine: false,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnCommitCharacter: true,
              }}
              onChange={(value) => setLocalYaml(value || "")}
              onMount={(editor, monaco) => {
                monaco.editor.setTheme('vs-dark');
              }}
            /> */}



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
