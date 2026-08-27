import React, { memo, useState } from 'react';

import { useGetValueQuery } from 'api/data';
import { useDeleteJsonConfig, useLoadJsonConfig } from 'api/loadJsonConfig';
import { fetchStatus, useMemoizeWhenFetched, useQueryState } from 'api/query';
import { BTN_RESTART } from 'constants/Icons';

import DroppableNodeList from 'features/menu/panels/DroppableNodeList';
import InlineBtn from 'features/common/buttons/InlineBtn';
import NodePane from 'features/menu/panels/NodePane';
import NodeListWrapper from 'features/menu/panels/NodeListWrapper';


const label = 'Policies';
const path = '/mcp-server/policies';

const rulePath = `${path}/rule`;

const ruleSelection = {
  'action':          'Action',
  'match/namespace': 'Match Namespace',
  'match/path':      'Match Path',
  'description':     'Description'
};

const policyRuleTitle = ({ name, action, matchNamespace, matchPath }) => {
  const match = matchNamespace || matchPath;
  return `${name} ${action}${match ? ` [${match}]` : ''}`;
};

const Policy = memo(function Policy({ policyRules = [] }) {
  console.debug('Policy Render');

  const deleteJsonConfig = useDeleteJsonConfig();
  const loadJsonConfig = useLoadJsonConfig();

  const [ policyLoading, setPolicyLoading ] = useState(false);
  const [ isOpen, setOpen ] = useState(false);

  const { data: defaultAction, ...actionQuery } = useGetValueQuery({
    keypath: `${path}/default-action`
  });

  const fetching = useMemoizeWhenFetched({
    'Default Action': fetchStatus(actionQuery),
    'Policy Rules': useQueryState(rulePath)
  });

  const policyConfig = {
    [path]: {
      'rule': policyRules.map(({ sequence, namespace, description }) => ({
        'name': sequence,
        'action': 'permit',
        'match/namespace': namespace,
        'description': description
      }))
    }
  };

  const resetRules = async () => {
    setPolicyLoading(true);
    try {
      await deleteJsonConfig([ policyConfig ]);
      await loadJsonConfig(policyConfig);
    } finally {
      setPolicyLoading(false);
    }
  };

  return (
    <NodeListWrapper
      title="MCP Server"
      fetching={fetching}
      disableCreate={true}
    >
      <NodePane
        title={label}
        label={label}
        keypath={path}
        isOpen={isOpen}
        nodeToggled={() => setOpen(open => !open)}
        disableDelete={true}
        subHeader={policyRules.length > 0 &&
          <div className="action-row">
            <InlineBtn
              icon={BTN_RESTART}
              label="Reset Rules"
              tooltip="Reset Rules"
              disabled={Boolean(policyLoading)}
              align="left"
              onClick={event => {
                event.stopPropagation();
                resetRules();
              }}
            />
          </div>
        }
        { ...{ 'Default Action': defaultAction } }
      >
        <DroppableNodeList
          label="Policy Rule"
          keypath={rulePath}
          baseSelect={[ 'sequence' ]}
          labelSelect={ruleSelection}
          getTitle={policyRuleTitle}
          allowDrop={false}
          disableCreate={true}
        />
      </NodePane>
    </NodeListWrapper>
  );
});

export default Policy;
