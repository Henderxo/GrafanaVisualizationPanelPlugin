import React, { useEffect, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Modal, useTheme2 } from '@grafana/ui';
import { saveAs } from 'file-saver';
import { css } from '@emotion/css';
import RuleInputWrapper from 'components/wrappers/RuleInputWrapper';

interface FileExportProps extends StandardEditorProps<string, any, { chartType?: string }> {}

export const FileExport: React.FC<FileExportProps> = ({ value, item }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [valueState, setValueState] = useState(value);

  const isMermaid = item.settings?.chartType === 'Export Mermaid Template';
  const fileName = isMermaid ? 'exported_template.mmd' : 'exported_config.yaml';

  const theme = useTheme2()

  const handleExport = () => {
    if (valueState) {
      const blob = new Blob([valueState], { type: 'application/octet-stream' });
      saveAs(blob, fileName);
      setIsModalOpen(false);
    }
  };

  useEffect(()=>{
    setValueState(value)
  }, [value])

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
        <Modal className={css`width: 1200px`} title={item.settings?.chartType} isOpen={isModalOpen} onDismiss={() => setIsModalOpen(false)}>
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
              <div>
                <RuleInputWrapper isIcon={false} backgroundColor={theme.colors.background.primary}> 
                <div style={{display: 'row', justifyContent: 'start', alignItems: 'start', textAlign: 'left'}}>
                  <strong>📜 File Content:</strong>
                </div>
                <pre style={{overflow: 'auto', backgroundColor: theme.colors.background.secondary,marginTop: '15px', padding: '10px',
                    whiteSpace: 'pre-wrap', maxHeight: '630px', textAlign: 'left', fontSize: '12px'
                }}>{valueState}</pre>
                </RuleInputWrapper>
               
              </div>
            )}

          <Modal.ButtonRow>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleExport}>
              Confirm
            </Button>
          </Modal.ButtonRow>
          </div>
        </Modal>
      )}
    </div>
  );
};
