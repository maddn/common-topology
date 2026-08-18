import React, { Fragment, memo, useMemo } from 'react';

import AccordionList from '../AccordionList';
import ResourceItem, { useResourceTemplates } from './Item';

import { useMcpDevice } from '../../selection';


const DEVICE_RESOURCE_TEMPLATES = [
  { path: 'nso://devices/device{name}/config', title: 'Config Only' },
  { path: 'nso://devices/device{name}', title: 'Config and Settings' },
  { path: 'nso://operational/devices/device{name}', title: 'Operational' }
];
const DEVICE_RESOURCE_TEMPLATE_URIS = DEVICE_RESOURCE_TEMPLATES.map(
  ({ path }) => path);


const DeviceResources = memo(function DeviceResources({
  isOpen, fade, toggle, onOutput
}) {
  console.debug('DeviceResources Render');

  const device = useMcpDevice();
  const templates = useResourceTemplates(DEVICE_RESOURCE_TEMPLATE_URIS);
  const contextNote = useMemo(() => device
    ? <Fragment>
        Selected device: <strong>{device}</strong>. This device will be used to
        resolve these resource templates.
      </Fragment>
    : <Fragment>
        Select one device in the topology. The selected device will be used to
        resolve these resource templates.
      </Fragment>,
    [ device ]);
  const items = useMemo(() =>
    DEVICE_RESOURCE_TEMPLATES.map(({path, title}) => {
      const template = templates.find(
        template => template.uriTemplate === path);
      return template && (
        <ResourceItem
          key={path}
          title={title}
          template={template}
          templateValues={device && { name: device }}
          onOutput={onOutput}
        />
      )
    }).filter(Boolean), [ device, onOutput, templates ]);

  return templates.length > 0 ? (
    <AccordionList
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      title="Device"
      contextNote={contextNote}
    >
      {items}
    </AccordionList>
  ) : null;
});

export default DeviceResources;
