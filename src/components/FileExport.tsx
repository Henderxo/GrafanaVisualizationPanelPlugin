import React, { useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Modal } from '@grafana/ui';
import { saveAs } from 'file-saver';
import { css } from '@emotion/css';

interface FileExportProps extends StandardEditorProps<string, any, { chartType?: string }> {}

export const FileExport: React.FC<FileExportProps> = ({ value, item }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isMermaid = item.settings?.chartType === 'Export Mermaid Template';
  const fileName = isMermaid ? 'exported_template.mmd' : 'exported_config.yaml';

  const handleExport = () => {
    if (value) {
      const blob = new Blob([value], { type: 'application/octet-stream' });
      saveAs(blob, fileName);
      setIsModalOpen(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Button
        variant="primary"
        onClick={() => setIsModalOpen(true)}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        📤 {item.settings?.chartType}
      </Button>

      {isModalOpen && (
        <Modal className={css`width: 800px`} title={item.settings?.chartType} isOpen={isModalOpen} onDismiss={() => setIsModalOpen(false)}>
          <div
            className={css`
              border: 2px solid grey;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding: 20px;
              text-align: center;
              border-radius: 8px;
            `}
          >
            <div style={{ marginTop: 15, fontSize: '16px', color: 'white' }}>
              <strong>File Name:</strong> {fileName}
            </div>

            {value && (
              <div>
                <div style={{display: 'row', justifyContent: 'start', alignItems: 'start', textAlign: 'left'}}>
                    <strong>📜 File Content:</strong>
                </div>
                <pre style={{overflow: 'auto', marginTop: '15px', padding: '10px',
                    whiteSpace: 'pre-wrap', maxHeight: '400px', textAlign: 'left', fontSize: '12px'
                }}>{value}</pre>
              </div>
            )}

          <div style={{ display: 'flex', flexDirection: 'row-reverse', marginTop: '15px' }}>
            <Button variant="secondary" onClick={handleExport}>
              Confirm
            </Button>
          </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
