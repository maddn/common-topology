import React, { Fragment, memo, useMemo } from 'react';

import AccordionList from '../AccordionList';
import Redeploy from './service/Redeploy';
import Undeploy from './service/Undeploy';
import CheckSync from './service/CheckSync';
import GetModifications from './service/GetModifications';

import { useTool } from './Item';
import { useMcpServiceName } from '../../selection';


const ServiceTools = memo(function ServiceTools({
  schema, isOpen, fade, toggle, onOutput
}) {
  console.debug('ServiceTools Render');

  const serviceName = useMcpServiceName(schema);
  const { label, toolPrefix: prefix, keyName } = schema;

  const redeployTool = useTool(`${prefix}_re_deploy`);
  const undeployTool = useTool(`${prefix}_un_deploy`);
  const checkSyncTool = useTool(`${prefix}_check_sync`);
  const getModificationsTool = useTool(`${prefix}_get_modifications`);

  const contextNote = useMemo(() => serviceName
    ? <Fragment>
        Selected service: <strong>{serviceName}</strong>. This service will be
        used as the key input for these tools.
      </Fragment>
    : <Fragment>
        Select a <strong>{label}</strong> service in the sidebar. The selected
        service will be used as the key
        input for these tools.
      </Fragment>,
    [ label, serviceName ]);

  const hasTools = redeployTool || undeployTool ||
    checkSyncTool || getModificationsTool;

  return hasTools ? (
    <AccordionList
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      title={label}
      contextNote={contextNote}
    >
      {redeployTool &&
        <Redeploy
          key={`${prefix}-redeploy`}
          tool={redeployTool}
          keyName={keyName}
          service={serviceName}
          onOutput={onOutput}
        />}
      {undeployTool &&
        <Undeploy
          key={`${prefix}-undeploy`}
          tool={undeployTool}
          keyName={keyName}
          service={serviceName}
          onOutput={onOutput}
        />}
      {checkSyncTool &&
        <CheckSync
          key={`${prefix}-check-sync`}
          tool={checkSyncTool}
          keyName={keyName}
          service={serviceName}
          onOutput={onOutput}
        />}
      {getModificationsTool &&
        <GetModifications
          key={`${prefix}-get-modifications`}
          tool={getModificationsTool}
          keyName={keyName}
          service={serviceName}
          onOutput={onOutput}
        />}
    </AccordionList>
  ) : null;
});

export default ServiceTools;
