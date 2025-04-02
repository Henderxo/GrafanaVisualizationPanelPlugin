import React, { useEffect, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Icon, Modal, Text, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { FileExport } from './FileExport';
import { SimpleOptions } from 'types';

interface FileExportButtonProps extends StandardEditorProps<string, any, {buttonTheme: 'primary'|'secondary', chartType?: string }> {}

export const FileExportButton: React.FC<FileExportButtonProps> = ({ value, item, context }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [theme, setTheme] = useState<'primary'|'secondary'>('primary')

  // useEffect(()=>{
  //   console.log('i dont trigger')
  //   setTheme(context.options?.buttonTheme??'primary')
  // }, [context.options?.buttonTheme])
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Button
        disabled={value?.length === 0}
        variant={context.options?.buttonTheme}
        onClick={() => setIsModalOpen(true)}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <Icon name={'upload'} className={css`margin-right: 6px;`}></Icon><Text>{item.settings?.chartType || "Export File"}</Text> 
      </Button>
      {isModalOpen&& <FileExport onClose={()=>{setIsModalOpen(false)}} isOpen={isModalOpen} onChange={()=>{}} value={value} titleString={item.settings.chartType}></FileExport>}
    </div>
  );
};