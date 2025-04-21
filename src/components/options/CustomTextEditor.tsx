import React, { useState, useEffect } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { TextArea } from '@grafana/ui';

interface CustomTextEditorProps extends StandardEditorProps<string, any, { rows?: number; placeholder?: string }> {}

export const CustomTextEditor: React.FC<CustomTextEditorProps> = ({ value, onChange, item }) => {
  const [text, setText] = useState(value || '');

  useEffect(() => {
    setText(value || '');
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setText(newValue);
    onChange(newValue); 
  };

  return (
    <TextArea
      value={text}
      onChange={handleChange}
      rows={item.settings?.rows || 5} 
      placeholder={item.settings?.placeholder || 'Enter text...'} 
    />
  );
};
