import React, { Fragment, memo, useMemo } from 'react';

import { removePrefixes } from 'api/query';

import AccordionList from '../AccordionList';
import ResourceItem, { useResources, useResourceTemplates } from './Item';

import { useMcpServiceName } from '../../selection';


const SERVICE_RESOURCES = [
  { path : 'nso://schema', title: 'Schema' },
  { path : 'nso://operational', title: 'Operational' },
  { path : 'nso:/', title: 'Config' }
];


const serviceResourceItems = schema => {
  const pathSuffix = removePrefixes(schema.path);
  return SERVICE_RESOURCES.map(({ path, title }) => ({
    title,
    resourceUri: `${path}${pathSuffix}`,
    templateUri: `${path}${pathSuffix}{name}`
  }));
};


const ServiceResources = memo(function ServiceResources({
  schema, isOpen, fade, toggle, onOutput
}) {
  console.debug('ServiceResources Render');

  const serviceName = useMcpServiceName(schema);
  const resourceItems = useMemo(() => serviceResourceItems(schema), [ schema ]);

  const resourceUris = useMemo(() =>
    resourceItems.map(({ resourceUri }) => resourceUri), [ resourceItems ]);
  const templateUris = useMemo(() =>
    resourceItems.map(({ templateUri }) => templateUri), [ resourceItems ]);

  const resources = useResources(resourceUris);
  const templates = useResourceTemplates(templateUris);

  const contextNote = useMemo(() => serviceName
    ? <Fragment>
        Selected service: <strong>{serviceName}</strong>. This service will be
        used to resolve resource templates in this group.
      </Fragment>
    : <Fragment>
        No matching <strong>{schema.label}</strong> service is selected. The
        static schema/config/operational resources will be used instead of
        resource templates.
      </Fragment>,
    [ schema.label, serviceName ]);

  const items = useMemo(() =>
    resourceItems.map(({ resourceUri, templateUri, title }) => {
      const resource = resources.find(resource => resource.uri === resourceUri);
      const template = templates.find(
        template => template.uriTemplate === templateUri);

      // Don't populate the template if there is no matching service,
      // this enables the user to read the static resource instead.
      return (resource || template) && (
        <ResourceItem
          key={resourceUri}
          title={title}
          resource={resource}
          template={template}
          templateValues={serviceName && { name: serviceName }}
          onOutput={onOutput}
        />
      )
    }).filter(Boolean), [
      onOutput, resourceItems, resources, serviceName, templates
    ]);
  const hasItems = resources.length > 0 || templates.length > 0;

  return hasItems ? (
    <AccordionList
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      title={schema.label}
      contextNote={contextNote}
    >
      {items}
    </AccordionList>
  ) : null;
});

export default ServiceResources;
