import React, { memo, useMemo } from 'react';

import { useToolsQuery } from 'api/mcp';

import AccordionList from '../AccordionList';
import ToolItem from './Item';


const CONTEXT_NOTE =
  'This group contains raw tools exposed by the MCP server.';


const AllTools = memo(function AllTools({
  isOpen, fade, toggle, onOutput
}) {
  console.debug('AllTools Render');

  const { data: tools = [] } = useToolsQuery();
  const items = useMemo(() =>
    tools.map(tool =>
      <ToolItem
        key={tool.name}
        title={tool.name}
        tool={tool}
        readOnly={true}
        showInputs={true}
        onOutput={onOutput}
      />
    ), [ onOutput, tools ]);

  return (
    <AccordionList
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      title="Tools"
      contextNote={CONTEXT_NOTE}
    >
      {items}
    </AccordionList>
  );
});

export default AllTools;
