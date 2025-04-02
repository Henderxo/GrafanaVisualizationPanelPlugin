import React, { useEffect, useState, useRef } from "react";
import { Button, Icon, Modal, Text } from "@grafana/ui";
import { StandardEditorProps } from "@grafana/data";
import { YamlEditor } from "./YamlEditor";
import { css } from "@emotion/css";
import { SimpleOptions } from "types";

interface Props extends StandardEditorProps<string, any, SimpleOptions> {}

export const YamlEditorButton: React.FC<Props> = ({ value, onChange, context}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isButtonDisabled, setButtonDisabled] = useState(true);
  useEffect(()=>{
    setTimeout(() => {
      setButtonDisabled(false);
    }, 1500);
  }, [])

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Button
        disabled={isButtonDisabled}
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
        variant={context.options?.buttonTheme??'primary'}
        onClick={() => setModalOpen(true)}
      >
        <Icon name={'pen'} className={css`margin-right: 6px;`}></Icon><Text>Edit YAML Config</Text>
      </Button>
      {isModalOpen &&
        <YamlEditor isOpen={isModalOpen} onClose={()=>setModalOpen(false)} onChange={(value)=>{onChange(value), setModalOpen(false)}} value={value}></YamlEditor>
      }
    </div>
  );
};
