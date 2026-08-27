import React, { memo, useCallback, useMemo, useState } from 'react';

import { useMemoizeWhenFetched, useQueryQuery, fetchStatus,
         createItemsSelector, useQueryState } from 'api/query';

import DroppableNodeList from 'features/menu/panels/DroppableNodeList';
import NodeListWrapper from 'features/menu/panels/NodeListWrapper';
import NodePane from 'features/menu/panels/NodePane';


export const label = 'Access Control';
export const path = '/nacm/rule-list';

const rulePath = `${path}/rule`;
const groupPath = `${path}/group`;

const defaultExcludeRuleLists = [];

const ruleListSelection = [
  'name'
];

const ruleSelection = {
  'path':              'Path',
  'access-operations': 'Access Operations',
  'action':            'Action'
};

const NacmRuleList = memo(function NacmRuleList({
  ruleList, openRuleList, toggledRuleList
}) {
  console.debug('NacmRuleList Render');

  const ruleSelector = useMemo(() =>
    createItemsSelector('parentName', ruleList.name), [ ruleList.name ]);
  const groupSelector = useMemo(() =>
    createItemsSelector('parentName', ruleList.name), [ ruleList.name ]);

  const groupsQuery = useQueryQuery({
    xpathExpr: groupPath,
    selection: [ '.', '../name' ],
    isLeafList: true
  }, { selectFromResult: groupSelector });
  const groups = (groupsQuery.data || []).map(group => group.name).join(', ');

  return (
    <NodePane
      title={ruleList.name}
      label="NACM Rule List"
      keypath={ruleList.keypath}
      isOpen={openRuleList === ruleList.keypath}
      fade={!!openRuleList}
      nodeToggled={toggledRuleList}
      disableDelete={true}
      Groups={groups}
    >
      <DroppableNodeList
        label="NACM Rule"
        keypath={`${ruleList.keypath}/rule`}
        baseSelect={[ 'name', '../name' ]}
        labelSelect={ruleSelection}
        selector={ruleSelector}
        allowDrop={false}
        disableCreate={true}
      />
    </NodePane>
  );
});

const NacmRuleLists = memo(function NacmRuleLists({
  excludeRuleLists = defaultExcludeRuleLists,
  headerActions
}) {
  console.debug('NacmRuleLists Render');

  const [ openRuleList, setOpenRuleList ] = useState(null);

  const ruleListsQuery = useQueryQuery({
    xpathExpr: path,
    selection: ruleListSelection
  });

  const fetching = useMemoizeWhenFetched({
    'NACM Rule Lists': fetchStatus(ruleListsQuery),
    'NACM Rule List Groups': useQueryState(groupPath),
    'NACM Rules': useQueryState(rulePath)
  });

  const ruleLists = useMemo(() =>
    (ruleListsQuery.data || [])
      .filter(ruleList => !excludeRuleLists.includes(ruleList.name)),
    [ excludeRuleLists, ruleListsQuery.data ]);

  const toggledRuleList = useCallback(keypath => {
    setOpenRuleList(open => open === keypath ? null : keypath);
  }, []);

  return (
    <NodeListWrapper
      title={label}
      label="NACM Rule List"
      keypath={path}
      fetching={fetching}
      disableCreate={true}
      headerActions={headerActions}
    >
      {ruleLists.map(ruleList =>
        <NacmRuleList
          key={ruleList.keypath}
          ruleList={ruleList}
          openRuleList={openRuleList}
          toggledRuleList={toggledRuleList}
        />)}
    </NodeListWrapper>
  );
});

export default NacmRuleLists;
