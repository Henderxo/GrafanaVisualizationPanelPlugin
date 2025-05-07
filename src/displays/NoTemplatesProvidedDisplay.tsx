import { Divider } from "@grafana/ui";
import { ClickableImgWrapper } from "components/wrappers/ClickableImgWrapper";
import React, { useState } from "react";
import { customHtmlBase } from '../types';
import logo from "img/logo.svg"
import { YamlEditor } from "modals/YamlEditor";

interface NoTemplatesProvidedDisplayProps extends customHtmlBase {
    yamlConfig: string,
    template: string
    onConfigChanges: (yaml: string, template: string) => void
}
export const NoTemplatesProvidedDisplay: React.FC<NoTemplatesProvidedDisplayProps> = ({bgColor, hover, color, yamlConfig, template, onConfigChanges }) =>{
    const [isYamlEditorOpen, setYamlEditorOpen] = useState(false);
    const handleYamlConfigClick = () =>{
        setYamlEditorOpen(true)
    }

    const handleMermaidTemplateClick = () =>{

    }

    return (
        <div style={{display:'flex', flexDirection: 'column', justifyContent: 'center', alignItems:'center'}}>
            <h1>{`Missing Yaml Configuration or Mermaid Template`}</h1>
            <div style={{display:'flex', flexDirection: 'row'}}>
                <ClickableImgWrapper onClick={()=>handleYamlConfigClick} label={'Customize Yaml Configuration'}>
                    <img style={{padding: '20px', paddingTop: '5px'}} width={'100%'} height={'100%'} src={logo} alt="No img found" />
                </ClickableImgWrapper>
                <Divider direction={'vertical'}/>
                <ClickableImgWrapper onClick={()=>handleMermaidTemplateClick} label={'Customize Mermaid Template'}>
                    <img style={{padding: '20px', paddingTop: '5px'}} width={'100%'} height={'100%'} src={logo} alt="No img found" />
                </ClickableImgWrapper>
            </div>
            <YamlEditor value={yamlConfig} onChange={(value) => onConfigChanges(value, template)} isOpen={isYamlEditorOpen} onClose={()=>setYamlEditorOpen(false)}></YamlEditor>
        </div>
    
    )
}
