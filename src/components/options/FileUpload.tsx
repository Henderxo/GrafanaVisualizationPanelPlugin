import React, { useEffect, useRef, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Modal, SelectMenuOptions } from '@grafana/ui';
import { css } from '@emotion/css';

interface FileUploadSettings {
  chartType?: string;
}

interface FileUploadProps extends StandardEditorProps<string, any, FileUploadSettings> {}

export const FileUploadEditor: React.FC<FileUploadProps> = ({ value, onChange, context, item }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setIsModalOpen(false);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFileName(null);
    setFileSize(null);
    setFileContent(null);
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
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Button style={{ width: '100%', display: 'flex', justifyContent: 'center' }} variant="secondary" onClick={() => setIsModalOpen(true)}>
          📂 Import File
        </Button>
      </div>

      {isModalOpen && (
        <Modal className={css`width: 800px`} title="Import File" isOpen={isModalOpen} onDismiss={handleCloseModal} >
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

            <p><strong>{item.settings?.chartType}</strong></p>

            <label htmlFor="fileInput">
              <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                📂 Select a File
              </Button>
            </label>
            <p style={{ color: '#666', marginTop: 10 }}>or drag & drop here</p>

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
                <pre style={{overflow: 'auto', marginTop: '15px', padding: '10px',
                    whiteSpace: 'pre-wrap', maxHeight: '400px', textAlign: 'left', fontSize: '12px'
                }}>{fileContent}</pre>
              </div>
            )}
            </div>
            <div style={{display: 'flex', flexDirection: 'row-reverse', marginTop: '5px' }}>
                <Button variant="secondary" onClick={handleConfirm}>
                    Confirm
                </Button>  
            </div>
        </Modal>
      )}

    </>
  );
};
