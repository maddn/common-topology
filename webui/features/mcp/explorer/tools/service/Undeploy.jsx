import React, { memo, useState } from 'react';

import ToolItem from '../Item';
import DryRunControl from './DryRunControl';


const Undeploy = memo(function Undeploy({
  tool, isOpen, fade, toggle, keyName, service, onOutput
}) {
  console.debug('Undeploy Render');

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
      title="Undeploy"
    >
      <DryRunControl onChange={setDryRunArguments} />
    </ToolItem>
  );
});

export default Undeploy;
