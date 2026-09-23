import React, { memo, useMemo } from 'react';

import AccordionGroup from 'features/common/AccordionGroup';
import ResourceItem, { useResources } from './Item';


const SYSTEM_RESOURCES = [
  { path: 'nso://devices/global-settings', title: 'Device Settings'},
  { path: 'nso://operational/zombies/service', title: 'Zombies'}
];
const SYSTEM_RESOURCE_URIS = SYSTEM_RESOURCES.map(({ path }) => path);

const CONTEXT_NOTE =
  'This group contains system resources exposed by the MCP server. These ' +
  'resources can be read directly.';


const SystemResources = memo(function SystemResources({
  isOpen, fade, toggle
}) {
  console.debug('SystemResources Render');

  const resources = useResources(SYSTEM_RESOURCE_URIS);
  const items = useMemo(() =>
    SYSTEM_RESOURCES.map(({path, title}) => {
      const resource = resources.find(resource => resource.uri === path);
      return resource && (
        <ResourceItem
          key={path}
          title={title}
          resource={resource}
        />
      )
    }).filter(Boolean), [ resources ]);

  return resources.length > 0 ? (
    <AccordionGroup
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      title="System"
      contextNote={CONTEXT_NOTE}
    >
      {items}
    </AccordionGroup>
  ) : null;
});

export default SystemResources;
