import React, { memo, useMemo } from 'react';

import { useResourcesQuery, useResourceTemplatesQuery } from 'api/mcp';
import { createItemsSelector } from 'api/query';

import Description from '../Description';
import ItemBase from '../ItemBase';


const fillTemplate = (template, values) =>
  Object.entries(values).reduce((uri, [ name, value ]) =>
    uri.replace(`{${name}}`, value), template.uriTemplate);

export function useResources(uris) {
  const selectResources = useMemo(() =>
    createItemsSelector('uri', uris), [ uris ]);
  const { data: resources = [] } = useResourcesQuery(undefined, {
    selectFromResult: selectResources
  });
  return resources;
}

export function useResourceTemplates(uriTemplates) {
  const selectTemplates = useMemo(() =>
    createItemsSelector('uriTemplate', uriTemplates), [ uriTemplates ]);
  const { data: templates = [] } = useResourceTemplatesQuery(undefined, {
    selectFromResult: selectTemplates
  });
  return templates;
}


const ResourceItem = memo(function ResourceItem({
  title, resource, template, templateValues, isOpen, fade, toggle, onOutput
}) {
  console.debug('ResourceItem Render');

  // Handles static resources, resolved templates, and raw template browsing.
  // Template-only entries without values are browsed as catalog entries.
  const uri = resource?.uri ||
    template && templateValues && fillTemplate(template, templateValues);
  const templateUri = template?.uriTemplate;

  const itemName = uri || templateUri;
  const name = template?.name || resource?.name;
  const description = template?.description || resource?.description;
  const displayTitle = title || itemName;
  const request = uri && {
    method: 'resources/read',
    params: { uri }
  };

  return (
    <ItemBase
      title={displayTitle}
      request={request}
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      onOutput={onOutput}
    >
      {name &&
        <div className="content-group__row">
          <span className="content-group__row-label">Name:</span>
          <span className="content-group__row-value">{name}</span>
        </div>}
      {templateUri &&
        <div className="content-group__row">
          <span className="content-group__row-label">
            Resource Template:
          </span>
          <span className="content-group__row-value">{templateUri}</span>
        </div>}
      {uri &&
        <div className="content-group__row">
          <span className="content-group__row-label">
            {templateUri ? 'Resolved Resource' : 'Resource'}:
          </span>
          <span className="content-group__row-value">{uri}</span>
        </div>}
      <Description description={description} service={true}/>
    </ItemBase>
  );
});

export default ResourceItem;
