import React, { memo, useState } from 'react';

import ToggleButton from 'features/topology/ToggleButton';
import ToolItem from '../Item';


const CheckSync = memo(function CheckSync({
  tool, isOpen, fade, toggle, keyName, service, onOutput
}) {
  console.debug('CheckSync Render');

  const [ deep, setDeep ] = useState(false)

  const toolArguments = service ? {
    [keyName]: service,
    ...(deep && { deep: true })
  } : {};

  return (
    <ToolItem
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      tool={tool}
      toolArguments={toolArguments}
      onOutput={onOutput}
      disabled={!service}
      title="Check-Sync"
    >
      <div className="content-group__row content-group__row--controls">
        <ToggleButton
          checked={deep}
          handleToggle={checked => setDeep(checked)}
          label="Deep"
        />
      </div>
    </ToolItem>
  );
});

export default CheckSync;
