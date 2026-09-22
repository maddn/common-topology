import React, { memo, useMemo } from 'react';

import { useMemoizeWhenFetched, useQueryQuery, fetchStatus, useQueryState,
         createItemsSelector } from 'api/query';

import NodeQueryList from 'features/menu/panels/NodeQueryList';
import CreatableNodeSection from 'features/menu/panels/CreatableNodeSection';
import NodePane from 'features/menu/panels/NodePane';
import { useOpenState } from 'features/common/AccordionGroup';


export const label = 'Brownfield Protection';
export const path = '/services/out-of-band/policy';

const rulePath = `${path}/rule`;

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

const OutOfBandPolicy = memo(function OutOfBandPolicy({
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
      <NodeQueryList
        label="Rule"
        keypath={`${policy.keypath}/rule`}
        baseSelect={[
          'concat(label, " [", default-action, "]")',
          '../servicepoint'
        ]}
        labelSelect={ruleSelection}
        selector={ruleSelector}
        disableCreate={true}
      />
    </NodePane>
  );
});

const OutOfBandPolicies = memo(function OutOfBandPolicies() {
  console.debug('OutOfBandPolicies Render');

  const { openItem, toggleItem } = useOpenState();
  const policiesQuery = useQueryQuery({
    xpathExpr: path,
    selection: policySelection
  });
  const fetching = useMemoizeWhenFetched({
    'OOB Policies': fetchStatus(policiesQuery),
    'OOB Policy Rules': useQueryState(rulePath)
  });

  return (
    <CreatableNodeSection
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
          openPolicy={openItem}
          toggledPolicy={toggleItem}
        />)}
    </CreatableNodeSection>
  );
});

export default OutOfBandPolicies;
