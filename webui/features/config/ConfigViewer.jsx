import './config.css';
import React from 'react';
import { useSelector } from 'react-redux';

import { usePlatformsQuery, useDevicesQuery } from 'features/topology/Icon';
import { getExpandedIcons,
         getRightSidebar } from 'features/topology/topologySlice';
import { getOpenTopology,
         getOpenServiceReferences } from 'features/menu/menuSlice';

import SidebarPane from 'features/common/SidebarPane';
import SidebarSection from 'features/common/SidebarSection';

import Config from './Config';
import OutOfBandPolicies from './OutOfBandPolicies';


const DefaultConfigHeaderActions = () => null;
const getNsoDeviceEditorKeypath = (device) =>
  `/ncs:devices/device{${device.name}}`;

function ConfigViewer({
    ConfigHeaderActions = DefaultConfigHeaderActions,
    getDeviceEditorKeypath = getNsoDeviceEditorKeypath }) {
  console.debug('Config Viewer Render');
  const expandedIcons = useSelector((state) => getExpandedIcons(state));
  const hidden = useSelector((state) => getRightSidebar(state) !== 'config');
  const openTopology = useSelector((state) => getOpenTopology(state));
  const serviceReferences = useSelector((state) =>
    getOpenServiceReferences(state));
  const platforms = usePlatformsQuery().data;
  const devices = useDevicesQuery().data;

  return (
    <SidebarPane
      hidden={hidden}
      footer={<OutOfBandPolicies />}
    >
      <SidebarSection title="Config Viewer">
        {devices && platforms && expandedIcons && expandedIcons.map(
          icon => {
            const device = devices?.find(({ name }) => name === icon);
            if (!device) {
              return null;
            }
            return <Config
              key={icon}
              device={icon}
              editorKeypath={getDeviceEditorKeypath(device) ||
                getNsoDeviceEditorKeypath(device)}
              managed={platforms.find(({ parentName }) => parentName === icon)}
              serviceReferences={serviceReferences}
              openTopology={openTopology}
              ConfigHeaderActions={ConfigHeaderActions}/>;
          })}
      </SidebarSection>
    </SidebarPane>
  );
}

export default ConfigViewer;
