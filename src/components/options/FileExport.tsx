import React, { useEffect, useRef, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Modal, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import RuleInputWrapper from 'components/wrappers/RuleInputWrapper';

interface FileExportProps extends StandardEditorProps<string, any, { chartType?: string }> {}

export const FileExport: React.FC<FileExportProps> = ({ value, item }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [valueState, setValueState] = useState(value);
  const [exportStatus, setExportStatus] = useState('');
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  
  const theme = useTheme2();
  
  const isMermaid = item.settings?.chartType === 'Export Mermaid Template';
  const defaultFileName = isMermaid ? 'exported_template.mmd' : 'exported_config.yaml';

  // Update valueState when value changes
  useEffect(() => {
    setValueState(value);
  }, [value]);
  
  // Reset status when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setExportStatus('');
    }
  }, [isModalOpen]);

  const handleExport = () => {
    if (!valueState) return;
    
    try {
      // Create a blob with the content
      const blob = new Blob([valueState], { type: 'text/plain' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      
      if (downloadLinkRef.current) {
        downloadLinkRef.current.href = url;
        downloadLinkRef.current.download = defaultFileName;
        downloadLinkRef.current.click();
        URL.revokeObjectURL(url);
        setExportStatus('File exported successfully!');
        
        // Close modal after a brief delay
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error exporting file:', error);
      setExportStatus('Error exporting file. Please try again.');
    }
  };

  // Alternative export method using the File System Access API (for modern browsers)
  const handleModernExport = async () => {
    if (!valueState) return;
    
    if (!('showSaveFilePicker' in window)) {
      setExportStatus('Your browser does not support the File System Access API. Using fallback method...');
      handleExport();
      return;
    }
    
    try {
      // This opens the native OS file picker
      const handle = await window.showSaveFilePicker({
        suggestedName: defaultFileName,
        types: [{
          description: isMermaid ? 'Mermaid Files' : 'YAML Files',
          accept: {
            'text/plain': [isMermaid ? '.mmd' : '.yaml'],
          },
        }],
      });
      
      // Create a writable stream and write the content
      const writable = await handle.createWritable();
      await writable.write(valueState);
      await writable.close();
      
      setExportStatus('File exported successfully!');
      
      // Close modal after a brief delay
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1500);
    } catch (error) {
      // User cancelled or API error
      console.error('Error saving file:', error);
      if (error.name !== 'AbortError') {
        setExportStatus('Error exporting file. Using fallback method...');
        handleExport();
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Button
        disabled={valueState?.length === 0}
        variant="primary"
        onClick={() => setIsModalOpen(true)}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        📤 {item.settings?.chartType || "Export File"}
      </Button>
      
      {/* Hidden download link for fallback method */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />

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
            <p><strong>Export {isMermaid ? 'Mermaid Template' : 'Configuration'}</strong></p>
            
            <div style={{width: '100%', marginBottom: '15px'}}>
              <Button 
                variant="primary" 
                fullWidth={true} 
                onClick={handleModernExport}
                disabled={!valueState}
              >
                💾 Save File
              </Button>
              
              {exportStatus && (
                <div style={{ marginTop: '10px', color: exportStatus.includes('Error') ? theme.colors.error.text : theme.colors.success.text }}>
                  {exportStatus}
                </div>
              )}
            </div>

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
                    maxHeight: '600px', 
                    textAlign: 'left', 
                    fontSize: '12px'
                  }}
                >
                  {valueState}
                </pre>
              </RuleInputWrapper>
            )}

            <Modal.ButtonRow>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleModernExport}>
                Export
              </Button>
            </Modal.ButtonRow>
          </div>
        </Modal>
      )}
    </div>
  );
};