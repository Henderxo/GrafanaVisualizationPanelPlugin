import React, { useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Icon, Text } from '@grafana/ui';
import { css } from '@emotion/css';
import { FileExport } from '../../modals/FileExport';
import ButtonWrapper from 'components/wrappers/ButtonWrapper';

interface FileExportButtonProps extends StandardEditorProps<string, any, {buttonTheme: 'primary'|'secondary', chartType?: string }> {}

export const FileExportButton: React.FC<FileExportButtonProps> = ({ value, item, context }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <ButtonWrapper
        disabled={value?.length === 0}
        variant={context.options?.buttonTheme}
        onClick={() => setIsModalOpen(true)}
        className={css`width: 100%; display: flex; justify-content: center;`}
      >
        <Icon name={'upload'} className={css`margin-right: 6px;`}></Icon><Text>{item.settings?.chartType || "Export File"}</Text> 
      </ButtonWrapper>
      {isModalOpen&& <FileExport onClose={()=>{setIsModalOpen(false)}} isOpen={isModalOpen} onChange={()=>{}} value={value} titleString={item.settings.chartType}></FileExport>}
    </div>
  );
};