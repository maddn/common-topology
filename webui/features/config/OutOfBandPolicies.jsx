import React, { memo, useCallback, useMemo, useState } from 'react';

import { useMemoizeWhenFetched, useQueryQuery, fetchStatus,
         createItemsSelector } from 'api/query';

import DroppableNodeList from 'features/menu/panels/DroppableNodeList';
import NodeListWrapper from 'features/menu/panels/NodeListWrapper';
import NodePane from 'features/menu/panels/NodePane';


export const label = 'Brownfield Protection';
export const path = '/services/out-of-band/policy';

const policySelection = [
  'servicepoint'
];

const ruleSelection = {
  'path':           'Path',
  'filter-expr':    'Filter',
  'priority':       'Priority',
  'default-action': 'Default Action',
  'at-create':      'At Create',
  'at-delete':      'At Delete',
  'at-value-set':   'At Value Set'
};

function OutOfBandPolicy({
  policy, openPolicy, toggledPolicy
}) {
  console.debug('OutOfBandPolicy Render');

  const ruleSelector = useMemo(() =>
    createItemsSelector('servicepoint', policy.name, 'priority'),
    [ policy.name ]);

  return (
    <NodePane
      title={policy.name}
      label="Out-of-band Policy"
      keypath={policy.keypath}
      isOpen={openPolicy === policy.keypath}
      fade={!!openPolicy}
      nodeToggled={toggledPolicy}
      disableDelete={true}
    >
      <DroppableNodeList
        label="Rule"
        keypath={`${policy.keypath}/rule`}
        baseSelect={[
          'concat(label, " [", default-action, "]")',
          '../servicepoint'
        ]}
        labelSelect={ruleSelection}
        selector={ruleSelector}
        allowDrop={false}
        disableCreate={true}
      />
    </NodePane>
  );
}

function OutOfBandPolicies() {
  console.debug('OutOfBandPolicies Render');

  const [ openPolicy, setOpenPolicy ] = useState(null);
  const policiesQuery = useQueryQuery({
    xpathExpr: path,
    selection: policySelection
  });
  const fetching = useMemoizeWhenFetched({
    'OOB Policies': fetchStatus(policiesQuery)
  });

  const toggledPolicy = useCallback(keypath => {
    setOpenPolicy(open => open === keypath ? null : keypath);
  }, []);

  return (
    <NodeListWrapper
      title={label}
      label="Out-of-band Policy"
      keypath={path}
      fetching={fetching}
      disableCreate={true}
    >
      {policiesQuery.data?.map(policy =>
        <OutOfBandPolicy
          key={policy.keypath}
          policy={policy}
          openPolicy={openPolicy}
          toggledPolicy={toggledPolicy}
        />)}
    </NodeListWrapper>
  );
}

export default memo(OutOfBandPolicies);
