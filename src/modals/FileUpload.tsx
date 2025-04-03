import React, { useRef, useState } from 'react';
import { Button, Icon, Modal, Text, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import RuleInputWrapper from 'components/wrappers/RuleInputWrapper';

interface FileUploadSettings {
  value: string,
  onChange: (newConfig: string)=>void
  onClose: ()=>void
  isOpen: boolean
  titleString: string
}

export const FileUpload: React.FC<FileUploadSettings> = ({ value, onChange, onClose, isOpen, titleString }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme2()

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const content = e.target.result as string;
        setFileName(file.name);
        setFileSize(file.size);
        setFileContent(content); 
      }
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (fileContent) {
      onChange(fileContent);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setFileName(null);
    setFileSize(null);
    setFileContent(null);
    onClose()
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) {
      handleFileRead(event.dataTransfer.files[0]);
    }
  };

  return (
    <>
      {isOpen && (
        <Modal className={css`width: 1200px`} title="Import File" isOpen={isOpen} onDismiss={handleCloseModal} >
          <div
            className={css`

              display: flex;
              flex-direction: column;
              justify-content: center;
              padding: 10px;
              text-align: center;
              border-radius: 8px;
            `}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".yaml,.yml,.mmd,.mermaid,.txt"
              style={{ display: 'none' }}
              id="fileInput"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />

            <div style={{width: '100%', border: 'dashed 3px', paddingTop: '12px', borderColor: theme.colors.border.strong}}>
              <p><strong>{titleString}</strong></p>
              <div  style={{width: '100%'}}>
                <label htmlFor="fileInput">
                <Button variant="primary" fullWidth={true} onClick={() => fileInputRef.current?.click()}>
                  <Icon name={'import'} className={css`margin-right: 6px;`}></Icon><Text>Select a File</Text>
                </Button>
                </label>
                <p style={{ color: '#666', marginTop: 10 }}>or drag & drop here</p>
              </div>
            </div>
           
            {(fileName || fileContent) && <RuleInputWrapper isIcon={false} backgroundColor={theme.colors.background.primary}>
              {fileName && (
                <div style={{ marginTop: 15, fontSize: '16px', color: 'white' }}>
                  <strong>📄 {fileName}</strong> ({(fileSize! / 1024).toFixed(2)} KB)
                </div>
              )}

              {fileContent && (
                <div>
                  <div style={{display: 'row', justifyContent: 'start', alignItems: 'start', textAlign: 'left'}}>
                      <strong>📜 File Content:</strong>
                  </div>
                  <pre style={{overflow: 'auto', backgroundColor: theme.colors.background.secondary, marginTop: '15px', padding: '10px',
                      whiteSpace: 'pre-wrap', maxHeight: '600px', textAlign: 'left', fontSize: '12px'
                  }}>{fileContent}</pre>
                </div>
              )}
            </RuleInputWrapper>}
            
            </div>
            <Modal.ButtonRow>
              <Button variant="destructive" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirm}>
                Confirm
              </Button>
            </Modal.ButtonRow>
        </Modal>
      )}

    </>
  );
};
