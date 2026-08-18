import React, { memo, useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useCreateMutation, useGetValueQuery,
         useSetValueMutation } from 'api/data';
import { useMemoizeWhenFetched, useQueryQuery, swapLabels } from 'api/query';
import { BTN_RESTART } from 'constants/Icons';
import { handleError } from 'features/nso/nsoSlice';

import InlineBtn from 'features/common/buttons/InlineBtn';
import NodePane from 'features/menu/panels/NodePane';
import NodeListWrapper from 'features/menu/panels/NodeListWrapper';


const label = 'Policies';
const path = '/mcp-server/policies';

const rulePath = `${path}/rule`;

const selection = {
  'default-action': 'Default Action'
};

const ruleSelection = [
  'sequence', 'action', 'match/namespace', 'match/path', 'description'
];

const ruleLabels = {
  'action':          'Action',
  'match/namespace': 'Match Namespace',
  'match/path':      'Match Path',
  'description':     'Description'
};

const PolicyButton = memo(function PolicyButton({
  title, running, rules, onRun
}) {
  console.debug('PolicyButton Render');

  const run = event => {
    event.stopPropagation();
    onRun(rules);
  };

  return (
    <InlineBtn
      icon={BTN_RESTART}
      label={running ? `${title}...` : title}
      tooltip={title}
      disabled={Boolean(running)}
      align="left"
      onClick={run}
    />
  );
});

const PolicyRule = memo(function PolicyRule({ rule, openRule, toggled }) {
  console.debug('PolicyRule Render');

  const sequence = rule.name;
  const match = rule.matchNamespace || rule.matchPath;

  return (
    <NodePane
      level={2}
      title={`${sequence} ${rule.action}${match ? ` [${match}]` : ''}`}
      label="MCP Policy Rule"
      keypath={rule.keypath}
      isOpen={openRule === rule.keypath}
      fade={!!openRule}
      nodeToggled={toggled}
      { ...swapLabels(rule, ruleLabels) }
    />
  );
});


const Policy = memo(function Policy({ policyRules = [] }) {
  console.debug('Policy Render');

  const dispatch = useDispatch();
  const [ create ] = useCreateMutation();
  const [ setValue ] = useSetValueMutation();
  const [ policyRunning, setPolicyRunning ] = useState(false);
  const [ isOpen, setOpen ] = useState(false);
  const [ openRule, setOpenRule ] = useState(null);
  const {
    data: defaultAction,
    isFetching: actionFetching,
    isSuccess: actionSuccess,
    isError: actionError
  } = useGetValueQuery({ keypath: `${path}/default-action` });
  const rulesQuery = useQueryQuery({
    xpathExpr: rulePath,
    selection: ruleSelection
  });
  const rules = rulesQuery.data || [];
  const fetching = useMemoizeWhenFetched({
    defaultAction: actionFetching ? '' :
      actionSuccess ? 'OK' : actionError ? 'Error' : 'OK',
    rules: rulesQuery.isFetching ? '' :
      rulesQuery.isSuccess ? 'OK' : rulesQuery.isError ? 'Error' : 'OK'
  });
  const toggled = useCallback(keypath =>
    setOpenRule(openRule => openRule === keypath ? null : keypath), []);
  const ruleItems = useMemo(() =>
    rules.map(rule =>
      <PolicyRule
        key={rule.keypath}
        rule={rule}
        openRule={openRule}
        toggled={toggled}
      />),
    [ openRule, rules, toggled ]);

  const runMutation = async promise => {
    const result = await promise;
    if (result.error) {
      throw new Error(result.error.message || JSON.stringify(result.error));
    }
    return result;
  };

  const createDemoPolicyRules = async (rules = []) => {
    const existingRules = rules.map(rule => String(rule.name));
    for (const { sequence, namespace, description } of policyRules) {
      const keypath = `${rulePath}{${sequence}}`;
      if (!existingRules.includes(String(sequence))) {
        await runMutation(create({
          keypath: rulePath,
          name: sequence
        }));
      }

      await runMutation(setValue({
        keypath,
        leaf: 'action',
        value: 'permit'
      }));
      await runMutation(setValue({
        keypath,
        leaf: 'match/namespace',
        value: namespace
      }));
      await runMutation(setValue({
        keypath,
        leaf: 'description',
        value: description
      }));
    }
  };

  const resetDemoPolicyRules = async rules => {
    setPolicyRunning(true);
    try {
      await createDemoPolicyRules(rules);
    } catch (error) {
      dispatch(handleError('Failed to reset MCP policy rules', error));
    } finally {
      setPolicyRunning(false);
    }
  };

  return (
    <NodeListWrapper
      title="MCP Server"
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
            <PolicyButton
              title="Reset Demo Rules"
              running={policyRunning}
              rules={rules}
              onRun={resetDemoPolicyRules}
            />
          </div>
        }
        { ...swapLabels({
          defaultAction
        }, selection) }
      >
        <NodeListWrapper
          title="Policy Rules"
          fetching={fetching}
          disableCreate={true}
        >
          {ruleItems}
        </NodeListWrapper>
      </NodePane>
    </NodeListWrapper>
  );
});

export default Policy;
