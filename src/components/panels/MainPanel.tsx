import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimplePanel } from './SimplePanel';
import { SimpleOptions } from 'types';
import { OtherViewPanel } from './YamlConfigPanel';
export const MainPanel: React.FC<PanelProps<SimpleOptions>> = (props) => {
const { data, options, width, height } = props;


  return (
    <div style={{ width, height, padding: '10px', overflow: 'hidden' }}>
      {options.activeView === 'mermaid' && <SimplePanel {...props}/>}
      {options.activeView === 'otherView' &&  <OtherViewPanel onOptionsChange={(options) => props.onOptionsChange(options)} options={options} data={data} />}
    </div>
  );
};
