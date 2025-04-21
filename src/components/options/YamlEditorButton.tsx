import React, { useEffect, useState } from "react";
import {  Icon, Text } from "@grafana/ui";
import { StandardEditorProps } from "@grafana/data";
import { YamlEditor } from "../../modals/YamlEditor";
import { css } from "@emotion/css";
import { SimpleOptions } from "types";
import ButtonWrapper from "components/wrappers/ButtonWrapper";

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
      <ButtonWrapper
        disabled={isButtonDisabled}
        className={css`width: 100%; display: flex; justify-content: center;`}
        variant={context.options?.buttonTheme??'primary'}
        onClick={() => setModalOpen(true)}
      >
        <Icon name={'pen'} className={css`margin-right: 6px;`}></Icon><Text>Edit YAML Config</Text>
      </ButtonWrapper>
      {isModalOpen &&
        <YamlEditor isOpen={isModalOpen} onClose={()=>setModalOpen(false)} onChange={(value)=>{onChange(value), setModalOpen(false)}} value={value}></YamlEditor>
      }
    </div>
  );
};
