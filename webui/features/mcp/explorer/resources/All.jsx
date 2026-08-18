import React, { memo, useMemo } from 'react';

import { useResourcesQuery } from 'api/mcp';

import AccordionList from '../AccordionList';
import ResourceItem from './Item';


const CONTEXT_NOTE =
  'This group contains raw resources exposed by the MCP server. These ' +
  'resources can be read directly.';


const AllResources = memo(function AllResources({
  isOpen, fade, toggle, onOutput
}) {
  console.debug('AllResources Render');

  const { data: resources = [] } = useResourcesQuery();
  const items = useMemo(() =>
    resources.map(resource =>
      <ResourceItem
        key={resource.uri}
        resource={resource}
        title={resource.uri}
        onOutput={onOutput}
      />
    ), [ onOutput, resources ]);

  return (
    <AccordionList
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      title="Resources"
      contextNote={CONTEXT_NOTE}
    >
      {items}
    </AccordionList>
  );
});

export default AllResources;
