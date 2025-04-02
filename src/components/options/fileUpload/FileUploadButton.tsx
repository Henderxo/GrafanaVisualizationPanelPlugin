import React, { useEffect, useRef, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Icon, Modal, SelectMenuOptions, Text, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import RuleInputWrapper from 'components/wrappers/RuleInputWrapper';
import { FileUpload } from './FileUpload';

interface FileUploadSettings {
  chartType?: string;
}

interface FileUploadProps extends StandardEditorProps<string, any, FileUploadSettings> {}

export const FileUploadButton: React.FC<FileUploadProps> = ({ value, onChange, item }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);


  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Button style={{ width: '100%', display: 'flex', justifyContent: 'center' }} variant="secondary" onClick={() => setIsModalOpen(true)}>
          <Icon className={css`margin-right: 6px;`} name={'import'}></Icon><Text>Select a File</Text>
        </Button>
      </div>
      {isModalOpen && <FileUpload onClose={()=>{setIsModalOpen(false)}} isOpen={isModalOpen} onChange={onChange} value={value} titleString={item.settings.chartType}></FileUpload>}
    </>
  );
};
