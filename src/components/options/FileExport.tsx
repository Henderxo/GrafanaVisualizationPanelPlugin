import React, { useEffect, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Icon, Modal, Text, useTheme2 } from '@grafana/ui';
import { saveAs } from 'file-saver';
import { css } from '@emotion/css';
import RuleInputWrapper from 'components/wrappers/RuleInputWrapper';

interface FileExportProps extends StandardEditorProps<string, any, { chartType?: string }> {}

export const FileExport: React.FC<FileExportProps> = ({ value, item }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [valueState, setValueState] = useState(value);
  const [exportStatus, setExportStatus] = useState('');
  
  const theme = useTheme2();
  
  const isMermaid = item.settings?.chartType === 'Export Mermaid Template';
  const defaultFileName = isMermaid ? 'exported_template.mmd' : 'exported_config.yaml';

  useEffect(() => {
    setValueState(value);
  }, [value]);
  
  useEffect(() => {
    if (!isModalOpen) {
      setExportStatus('');
    }
  }, [isModalOpen]);

  const handleExport = () => {
    if (!valueState) return;
    
    try {
      const blob = new Blob([valueState], { type: 'text/plain' });
      saveAs(blob, defaultFileName);
      
      setExportStatus('File exported successfully!');
      
      setTimeout(() => {
        setIsModalOpen(false);
      }, 500);
    } catch (error) {
      console.error('Error exporting file:', error);
      setExportStatus('Error exporting file. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Button
        disabled={valueState?.length === 0}
        variant="secondary"
        onClick={() => setIsModalOpen(true)}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <Icon name={'upload'} className={css`margin-right: 6px;`}></Icon><Text>{item.settings?.chartType || "Export File"}</Text> 
      </Button>

      {isModalOpen && (
        <Modal 
          className={css`width: 1200px`} 
          title={item.settings?.chartType || "Export File"} 
          isOpen={isModalOpen} 
          onDismiss={() => setIsModalOpen(false)}
        >
          <div
            className={css`
              display: flex;
              width: 100%;
              height: 100%;
              flex-direction: column;
              justify-content: center;
              padding: 10px;
              text-align: center;
              border-radius: 8px;
            `}
          >
            {valueState && (
              <RuleInputWrapper isIcon={false} backgroundColor={theme.colors.background.primary}> 
                <div style={{display: 'row', justifyContent: 'start', alignItems: 'start', textAlign: 'left'}}>
                  <strong>📜 File Content:</strong>
                </div>
                <pre 
                  style={{
                    overflow: 'auto', 
                    backgroundColor: theme.colors.background.secondary,
                    marginTop: '15px', 
                    padding: '10px',
                    whiteSpace: 'pre-wrap', 
                    maxHeight: '550px', 
                    textAlign: 'left', 
                    fontSize: '12px'
                  }}
                >
                  {valueState}
                </pre>
              </RuleInputWrapper>
            )}

            <Modal.ButtonRow>
              <Button variant="destructive" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleExport}>
                Export
              </Button>
            </Modal.ButtonRow>
          </div>
        </Modal>
      )}
    </div>
  );
};