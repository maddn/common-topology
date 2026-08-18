import React, { memo, useMemo } from 'react';

import { usePromptsQuery } from 'api/mcp';

import AccordionList from '../AccordionList';
import PromptItem from './Item';


const CONTEXT_NOTE =
  'This group contains raw prompts exposed by the MCP server. Running a ' +
  'prompt generates a response using example values.';

const PROMPT_DEFAULTS = {
  cdb_backup: {
    BACKUP_NAME: 'mcp-demo-backup',
    BACKUP_PATH: '/tmp',
    INCLUDE_ROLLBACK: 'false',
    DRY_RUN: 'true',
    RESTORE_PATH: '/'
  },
  schedule_task: {
    TASK_NAME: 'daily-demo-router-check-sync',
    ACTION_NAME: 'check-sync',
    ACTION_NODE: '/ncs:devices/device{demo-router}',
    DEVICE_NAME: 'demo-router'
  },
  bulk_change: {},
  service_creation: {
    SERVICE_TYPE: 'l3vpn',
    SERVICE_NAME: 'demo-vpn'
  },
  error_recovery: {
    SERVICE_TYPE: 'l3vpn',
    SERVICE_NAME: 'demo-vpn'
  },
  device_onboard: {
    DEVICE_NAME: 'demo-router',
    DEVICE_ADDRESS: '192.0.2.10',
    DEVICE_TYPE: 'cisco-ios-netsim-cli',
    AUTH_GROUP: 'default',
    PORT: '22'
  },
  zombie_cleanup: {}
};


const AllPrompts = memo(function AllPrompts({
  isOpen, fade, toggle, onOutput
}) {
  console.debug('AllPrompts Render');

  const { data: prompts = [] } = usePromptsQuery();
  const items = useMemo(() =>
    prompts?.map(prompt =>
      <PromptItem
        key={prompt.name}
        prompt={prompt}
        title={prompt.name}
        defaultArguments={PROMPT_DEFAULTS[prompt.name]}
        onOutput={onOutput}
      />
    ), [ onOutput, prompts ]);

  return (
    <AccordionList
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      title="Prompts"
      contextNote={CONTEXT_NOTE}
    >
      {items}
    </AccordionList>
  );
});

export default AllPrompts;
