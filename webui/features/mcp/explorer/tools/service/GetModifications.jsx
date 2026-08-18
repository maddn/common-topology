import React, { memo, useState } from 'react';

import ToggleButton from 'features/topology/ToggleButton';
import ToolItem from '../Item';


const GetModifications = memo(function GetModifications({
  tool, isOpen, fade, toggle, keyName, service, onOutput
}) {
  console.debug('GetModifications Render');

  const [ reverse, setReverse ] = useState(false)

  const toolArguments = service ? {
    [keyName]: service,
    ...(reverse && { reverse: true })
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
      title="Get Modifications"
    >
      <div className="content-group__row content-group__row--controls">
        <ToggleButton
          checked={reverse}
          handleToggle={checked => setReverse(checked)}
          label="Reverse"
        />
      </div>
    </ToolItem>
  );
});

export default GetModifications;
