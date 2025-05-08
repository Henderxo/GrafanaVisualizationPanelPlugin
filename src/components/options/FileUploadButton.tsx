import React, { useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Icon, Text} from '@grafana/ui';
import { css } from '@emotion/css';
import { FileUpload } from '../../modals/FileUpload';
import ButtonWrapper from 'components/wrappers/ButtonWrapper';

interface FileUploadSettings {
  chartType?: string;
  buttonTheme: 'primary'|'secondary'
}

interface FileUploadProps extends StandardEditorProps<string, any, FileUploadSettings> {}

export const FileUploadButton: React.FC<FileUploadProps> = ({ value, onChange, item, context }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <ButtonWrapper className={css`width: 100%; display: flex; justify-content: center;`} variant={context.options?.buttonTheme??'primary'} onClick={() => setIsModalOpen(true)}>
          <Icon className={css`margin-right: 6px;`} name={'import'}></Icon><Text>Select a File</Text>
        </ButtonWrapper>
      </div>
      {isModalOpen && <FileUpload onClose={()=>{setIsModalOpen(false)}} isOpen={isModalOpen} onChange={onChange} value={value} titleString={item.settings.chartType}></FileUpload>}
    </>
  );
};
