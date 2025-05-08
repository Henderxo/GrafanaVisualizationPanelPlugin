import React, { useEffect, useState } from 'react';
import { Button, Modal, useTheme2 } from '@grafana/ui';
import { saveAs } from 'file-saver';
import { css } from '@emotion/css';

interface FileExportProps {
  value: string,
  onChange: (newConfig: string) => void
  onClose: () => void
  isOpen: boolean
  titleString: string
}

export const FileExport: React.FC<FileExportProps> = ({ value, onClose, isOpen, titleString }) => {
  const [valueState, setValueState] = useState(value);
  
  const theme = useTheme2();
  
  const isMermaid = titleString === 'Export Mermaid Template';
  const defaultFileName = isMermaid ? 'exported_template.mmd' : 'exported_config.yaml';

  useEffect(() => {
    setValueState(value);
  }, [value]);
  
  const handleExport = () => {
    if (!valueState) {
      return;
    }
    
    try {
      const blob = new Blob([valueState], { type: 'text/plain' });
      saveAs(blob, defaultFileName); 
      setTimeout(() => {
        onClose()
      }, 500);
    } catch (error) {
      console.error('Error exporting file:', error);
    }
  };

  return (  
    <>
      {isOpen && (
        <Modal 
          className={css`
            width: 1340px;
            height: 800px;
            display: flex;
            flex-direction: column;
            `} 
          title={titleString || "Export File"} 
          isOpen={isOpen} 
          onDismiss={() => onClose()}
        >
          <div
            className={css`
              display: flex;
              width: 100%;
              height: 100%;
              flex-direction: column;
              justify-content: center;
              text-align: center;
              border-radius: 8px;
            `}
          >
            {valueState && (
              <>
              <div style={{display: 'row', justifyContent: 'start', alignItems: 'start', textAlign: 'left'}}>
                  <strong>📜 File Content:</strong>
                </div>
                <pre 
                  style={{
                    overflow: 'auto', 
                    backgroundColor: theme.colors.background.secondary,
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap', 
                    maxHeight: '550px', 
                    textAlign: 'left', 
                    fontSize: '12px',
                    marginBottom: '0px',
                  }}
                >
                  {valueState}
                </pre>
              </>
            )}

            <Modal.ButtonRow>
              <Button variant="destructive" onClick={() => onClose()}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleExport}>
                Export
              </Button>
            </Modal.ButtonRow>
          </div>
        </Modal>
      )}
    </>
  );
};