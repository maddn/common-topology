import React, { Fragment, memo, useMemo } from 'react';

import AccordionList from '../AccordionList';
import ToolItem, { useTools } from './Item';

import { useMcpDevice } from '../../selection';


const DEVICE_TOOLS = [
  { title: 'Ping', name: 'devices_device_ping' },
  { title: 'Check Sync', name: 'devices_device_check_sync' },
  { title: 'Compare Config', name: 'devices_device_compare_config' },
  { title: 'Sync From', name: 'devices_device_sync_from' },
  { title: 'Sync To', name: 'devices_device_sync_to' },
  { title: 'Connect', name: 'devices_device_connect' },
  { title: 'Disconnect', name: 'devices_device_disconnect' }
];
const DEVICE_TOOL_NAMES = DEVICE_TOOLS.map(({ name }) => name);


const DeviceTools = memo(function DeviceTools({
  isOpen, fade, toggle, onOutput
}) {
  console.debug('DeviceTools Render');

  const device = useMcpDevice();
  const tools = useTools(DEVICE_TOOL_NAMES);
  const contextNote = useMemo(() => device
    ? <Fragment>
        Selected device: <strong>{device}</strong>. This device will be used
        as the device input for these tools.
      </Fragment>
    : <Fragment>
        Select one device in the topology. The selected device will be used as
        the device input for these tools.
      </Fragment>,
    [ device ]);
  const items = useMemo(() =>
    DEVICE_TOOLS.map(item => {
      const tool = tools.find(tool => tool.name === item.name);
      return tool &&
        <ToolItem
          key={item.name}
          tool={tool}
          toolArguments={{ device }}
          onOutput={onOutput}
          disabled={!device}
          title={item.title}
        >
          {device &&
            <div className="content-group__row">
              <span className="content-group__row-label">device:</span>
              <span className="content-group__row-value">{device}</span>
            </div>}
        </ToolItem>
    }).filter(Boolean), [ device, onOutput, tools ]);

  return tools.length > 0 ? (
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

export default DeviceTools;
