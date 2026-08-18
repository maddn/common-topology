import React, { memo, useState } from 'react';

import ToolItem from '../Item';
import DryRunControl from './DryRunControl';


const Redeploy = memo(function Redeploy({
  tool, isOpen, fade, toggle, service, keyName, onOutput
}) {
  console.debug('Redeploy Render');

  const [ dryRunArguments, setDryRunArguments ] = useState({});

  const toolArguments = service ? {
    [keyName]: service,
    ...dryRunArguments
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
      title="Redeploy"
    >
      <DryRunControl onChange={setDryRunArguments} />
    </ToolItem>
  );
});

export default Redeploy;
