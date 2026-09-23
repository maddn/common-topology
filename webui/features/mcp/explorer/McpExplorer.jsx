import React, { Fragment, memo, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  useToolsQuery, useToolsQueryState,
  useResourcesQuery, useResourcesQueryState,
  useResourceTemplatesQuery, useResourceTemplatesQueryState,
  usePromptsQuery, usePromptsQueryState
} from 'api/mcp';

import { fetchStatus, useMemoizeWhenFetched } from 'api/query';
import { BTN_CHAT, BTN_CHAT_ACTIVE } from 'constants/Icons';
import { getRightSidebar } from 'features/topology/topologySlice';

import Accordion from 'features/common/Accordion';
import SidebarPane from 'features/common/SidebarPane';
import SidebarSection from 'features/common/SidebarSection';
import StatusDot from 'features/common/StatusDot';
import InlineBtn from 'features/common/buttons/InlineBtn';
import { useOpenStateForItem } from 'features/common/AccordionGroup';

import Policy from './Policy';
import ReadTools from './tools/Read';
import DeviceTools from './tools/Device';
import ServiceTools from './tools/Service';
import AllTools from './tools/All';
import SystemResources from './resources/System';
import DeviceResources from './resources/Device';
import ServiceResources from './resources/Service';
import AllResources from './resources/All';
import ResourceTemplates from './resources/Templates';
import Prompts from './prompts/All';

import { getMcpHasViewer, getMcpServerStatus, getMcpVisible,
         viewerToggled } from '../mcpSlice';


function useFetchStatus() {
  return useMemoizeWhenFetched({
    'MCP Tools':              fetchStatus(useToolsQueryState()),
    'MCP Resources':          fetchStatus(useResourcesQueryState()),
    'MCP Resource Templates': fetchStatus(useResourceTemplatesQueryState()),
    'MCP Prompts':            fetchStatus(usePromptsQueryState())
  });
}

const serverMessages = {
  loading: 'Checking MCP server',
  ok: 'MCP server reachable',
  error: 'MCP server unavailable'
};

function useServerTooltip(status) {
  const itemCounts = [
    { label: 'Tools', value: useToolsQuery().data?.length || 0 },
    { label: 'Resources', value: useResourcesQuery().data?.length || 0 },
    {
      label: 'Templates',
      value: useResourceTemplatesQuery().data?.length || 0
    },
    { label: 'Prompts', value: usePromptsQuery().data?.length || 0 }
  ];

  const message = serverMessages[status] || serverMessages.loading;

  if (status !== 'ok') {
    return message;
  }

  return (
    <table className="tooltip">
      <tbody>
        <tr><td colSpan="2">MCP server reachable:</td></tr>
        {itemCounts.map(({ label, value }) =>
          <tr key={label}><td>{label}:</td><td>{value}</td></tr>
        )}
      </tbody>
    </table>
  );
}


const McpExplorer = memo(function McpExplorer({
  policyRules = [],
  serviceSchemas = []
}) {
  console.debug('MCP Explorer Render');

  const dispatch = useDispatch();
  const hidden = useSelector((state) => getRightSidebar(state) !== 'mcp');
  const serverStatus = useSelector(getMcpServerStatus);
  const viewerVisible = useSelector(getMcpVisible);
  const hasViewer = useSelector(getMcpHasViewer);
  const fetching = useFetchStatus();
  const serverTooltip = useServerTooltip(serverStatus);

  const [ openView, setOpenView ] = useState('curated');
  const openStateForItem = useOpenStateForItem(openView);
  const toggleViewer = useCallback(() => {
    dispatch(viewerToggled());
  }, [ dispatch ]);
  const viewSelector = (view, title) => (
    <Accordion
      level="0"
      title={title}
      isOpen={openView === view}
      toggle={() => setOpenView(view)}
    />
  );

  return (
    <SidebarPane
      hidden={hidden}
      footer={<Policy policyRules={policyRules} />}
    >
      <SidebarSection
        title="MCP Explorer"
        fetching={fetching}
        headerActions={
          <Fragment>
            <InlineBtn
              icon={hasViewer ? BTN_CHAT_ACTIVE : BTN_CHAT}
              hidden={viewerVisible}
              tooltip={hasViewer ? 'Show MCP Session' : 'Open MCP Session'}
              onClick={toggleViewer}
            />
            <InlineBtn
              icon={BTN_CHAT_ACTIVE}
              hidden={!viewerVisible}
              tooltip="Hide MCP Session"
              onClick={toggleViewer}
            />
            <StatusDot
              state={serverStatus}
              tooltip={serverTooltip}
            />
          </Fragment>
        }
      >
        {viewSelector('curated', 'Curated View')}
        {viewSelector('raw', 'Raw View')}
      </SidebarSection>

      <Accordion
        isOpen={openView === 'curated'}
        variableHeight={true}
        isContainerOnly={true}
      >
        <SidebarSection title="Default Restricted Tools">
          <ReadTools {...openStateForItem('tools-read')} />
          <DeviceTools {...openStateForItem('tools-device')} />
          <div className="content-group content-group--empty-message">
            <div className="content-group__row">
              <span className="content-group__row-value">
                No supported default tools for this view are currently
                advertised.
              </span>
            </div>
          </div>
        </SidebarSection>

        <SidebarSection title="Default Restricted Resources">
          <DeviceResources {...openStateForItem('resources-device')} />
          <SystemResources {...openStateForItem('resources-system')} />
          <div className="content-group content-group--empty-message">
            <div className="content-group__row">
              <span className="content-group__row-value">
                No supported default resources for this view are currently
                advertised.
              </span>
            </div>
          </div>
        </SidebarSection>

        <SidebarSection title="Service Tools">
          {serviceSchemas.map(schema =>
            <ServiceTools
              key={schema.path}
              schema={schema}
              {...openStateForItem(`tools-service-${schema.path}`)}
            />)}
          <div className="content-group content-group--empty-message">
            <div className="content-group__row">
              <span className="content-group__row-value">
                No supported service tools for this view are currently
                advertised.
              </span>
            </div>
          </div>
        </SidebarSection>

        <SidebarSection title="Service Resources">
          {serviceSchemas.map(schema =>
            <ServiceResources
              key={schema.path}
              schema={schema}
              {...openStateForItem(`resources-service-${schema.path}`)}
            />)}
          <div className="content-group content-group--empty-message">
            <div className="content-group__row">
              <span className="content-group__row-value">
                No supported service resources for this view are currently
                advertised.
              </span>
            </div>
          </div>
        </SidebarSection>
      </Accordion>

      <Accordion
        isOpen={openView === 'raw'}
        variableHeight={true}
        isContainerOnly={true}
      >
        <SidebarSection title="All Items">
          <AllTools {...openStateForItem('all-tools')} />
          <ResourceTemplates {...openStateForItem('all-resource-templates')} />
          <AllResources {...openStateForItem('all-resources')} />
          <Prompts {...openStateForItem('prompts')} />
        </SidebarSection>
      </Accordion>

    </SidebarPane>
  );
});

export default McpExplorer;
