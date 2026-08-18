import React, { memo, useState } from 'react';

import InlineBtn from 'features/common/buttons/InlineBtn';
import ToggleButton from 'features/topology/ToggleButton';


const FORMATS = [ 'cli', 'cli-c', 'native', 'xml' ];

const DryRunControl = memo(function DryRunControl({ onChange }) {
  console.debug('DryRunControl Render');

  const [ enabled, setEnabled ] = useState(false);
  const [ outformat, setOutformat ] = useState(undefined);

  const update = (enabled, outformat) => {
    setEnabled(enabled);
    setOutformat(outformat);
    onChange(enabled
      ? { 'dry-run': outformat ? { outformat } : {} }
      : {});
  };

  const toggleOutformat = format =>
    update(enabled, format === outformat ? undefined : format);

  return (
    <>
      <div className="content-group__row content-group__row--controls">
        <ToggleButton
          checked={enabled}
          handleToggle={checked => update(checked, outformat)}
          label="Dry Run"
        />
      </div>
      {enabled &&
        <div className="content-group__row content-group__row--controls">
          {FORMATS.map(format =>
            <InlineBtn
              key={format}
              label={format}
              style={outformat === format && 'primary'}
              tooltip={`Run dry-run using ${format} format`}
              onClick={() => toggleOutformat(format)}
              align="left"
            />)}
        </div>}
    </>
  );
});

export default DryRunControl;
