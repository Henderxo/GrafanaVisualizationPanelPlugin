import React, { useEffect, useState, useRef } from "react";
import { Button, Modal } from "@grafana/ui";
import { StandardEditorProps } from "@grafana/data";
import { YamlEditor } from "./YamlEditor";

interface Props extends StandardEditorProps<string> {}

export const YamlEditorButton: React.FC<Props> = ({ value, onChange }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Button
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
        variant="primary"
        onClick={() => setModalOpen(true)}
      >
        Edit YAML Config
      </Button>
      {isModalOpen &&
        <YamlEditor isOpen={isModalOpen} onClose={()=>setModalOpen(false)} onChange={(value)=>{onChange(value), setModalOpen(false)}} value={value}></YamlEditor>
      }
    </div>
  );
};
