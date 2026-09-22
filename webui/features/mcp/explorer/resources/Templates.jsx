import React, { memo, useMemo } from 'react';

import { useResourceTemplatesQuery } from 'api/mcp';

import AccordionGroup from 'features/common/AccordionGroup';
import ResourceItem from './Item';


const CONTEXT_NOTE =
  'This group contains raw resource templates exposed by the MCP server.';


const ResourceTemplates = memo(function ResourceTemplates({
  isOpen, fade, toggle, onOutput
}) {
  console.debug('ResourceTemplates Render');

  const { data: templates = [] } = useResourceTemplatesQuery();
  const items = useMemo(() =>
    templates.map(template =>
      <ResourceItem
        key={template.uriTemplate}
        template={template}
        title={template.uriTemplate}
        onOutput={onOutput}
      />
    ), [ onOutput, templates ]);

  return (
    <AccordionGroup
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      title="Resource Templates"
      contextNote={CONTEXT_NOTE}
    >
      {items}
    </AccordionGroup>
  );
});

export default ResourceTemplates;
