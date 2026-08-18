import React, { memo, useMemo } from 'react';

import AccordionList from '../AccordionList';
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
  isOpen, fade, toggle, onOutput
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
          onOutput={onOutput}
        />
      )
    }).filter(Boolean), [ onOutput, resources ]);

  return resources.length > 0 ? (
    <AccordionList
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      title="System"
      contextNote={CONTEXT_NOTE}
    >
      {items}
    </AccordionList>
  ) : null;
});

export default SystemResources;
