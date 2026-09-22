import React from 'react';
import { forwardRef, useImperativeHandle, useRef } from 'react';

import { useOpenState } from 'features/common/AccordionGroup';

import NodePane from './NodePane';
import CreatableNodeSection from './CreatableNodeSection';

import { pathKeyRegex, swapLabels, useQueryQuery } from 'api/query';


const removeEmptyFields = data => Object.fromEntries(Object.entries(data)
  .filter(([, value]) =>
    value !== undefined && value !== null && value !== ''));

const NodeQueryList = forwardRef(function NodeQueryList({
  label, keypath, noTitle,
  baseSelect = [], labelSelect, isLeafList, selector,
  newItemDefaults, newItemDragType, defaultsPath, newItemDragIcon,
  getTitle, disableCreate, disableGoTo, calculateName, ...rest
}, ref) {
  console.debug('NodeQueryList Render');

  const nodeListRef = useRef({});
  const { openItem, toggleItem } = useOpenState();

  const { data } = useQueryQuery({
    xpathExpr: keypath.replace(pathKeyRegex, ''),
    selection: [ ...baseSelect, ...Object.keys(labelSelect || {}) ],
    isLeafList
  }, { selectFromResult: selector });

  useImperativeHandle(ref, () => ({
    openNewItem(defaults) {
      nodeListRef.current.openNewItem(defaults);
    },
    async createNewItem(name) {
      const key = typeof calculateName === 'function'
        ? calculateName(name, data)
        : name;
      await nodeListRef.current.createNewItem(key);
      return key;
    }
  }), [ calculateName, data ]);

  return (
    <CreatableNodeSection
      title={!noTitle && `${label}s`}
      keypath={keypath}
      label={label}
      disableCreate={disableCreate}
      newItemDefaults={newItemDefaults}
      newItemDragType={newItemDragType}
      defaultsPath={defaultsPath}
      newItemDragIcon={newItemDragIcon}
      ref={nodeListRef}
      { ...rest }
    >
      {data?.map(({ name, keypath, ...item }) =>
        <NodePane
          title={String(getTitle ? getTitle({ name, ...item }) : name)}
          key={keypath}
          keypath={keypath}
          label={label}
          level={2}
          isOpen={openItem === keypath}
          fade={!!openItem}
          nodeToggled={toggleItem}
          disableGoTo={disableGoTo}
          { ...swapLabels(removeEmptyFields(item), labelSelect) }
        />
      )}
    </CreatableNodeSection>
  );
});

export default NodeQueryList;
