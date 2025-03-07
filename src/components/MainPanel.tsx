import React, { useState } from 'react';
import { PanelProps } from '@grafana/data';
import { Button } from '@grafana/ui';
import { SimplePanel } from './SimplePanel';
import { SimpleOptions } from 'types';
import { OtherViewPanel } from './YamlConfigPanel';

interface Props extends PanelProps<SimpleOptions> {}

export const MainPanel: React.FC<Props> = (props) => {
const { data, options, width, height } = props;

  return (
    <div style={{ width, height, padding: '10px', overflow: 'hidden' }}>
      {options.activeView === 'mermaid' && <SimplePanel {...props}/>}
      {options.activeView === 'otherView' &&  <OtherViewPanel options={options} data={data} />}
    </div>
  );
};
