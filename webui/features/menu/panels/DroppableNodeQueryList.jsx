import React from 'react';
import { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useDrop } from 'react-dnd';
import classNames from 'classnames';

import { DEVICE } from 'constants/ItemTypes';
import { configurationEditorUrl } from 'features/nso/WebuiOne';
import NodeQueryList from './NodeQueryList';

import { stopThenGoToUrl } from 'api/comet';

export const DROP_BEHAVIOUR_CREATE_ONLY = 0;
export const DROP_BEHAVIOUR_OPEN_NEW_ITEM = 1;
export const DROP_BEHAVIOUR_GOTO = 2;

function DroppableNodeQueryList({
  allowDrop, accept,
  dropBehaviour = DROP_BEHAVIOUR_CREATE_ONLY,
  keypath, dropItemDefaults, ...props
}) {
  console.debug('DroppableNodeQueryList Render');
  const dispatch = useDispatch();
  const nodeListRef = useRef({});

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: DEVICE,
    drop: async ({ name }) => {
      if (dropBehaviour !== DROP_BEHAVIOUR_OPEN_NEW_ITEM) {
        const key = await nodeListRef.current.createNewItem(name);
        if (dropBehaviour === DROP_BEHAVIOUR_GOTO) {
          dispatch(stopThenGoToUrl(
            configurationEditorUrl(`${keypath}{${key}}`, true)));
        }
      } else {
        nodeListRef.current.openNewItem(
          typeof dropItemDefaults === 'function'
            ? dropItemDefaults(name)
            : dropItemDefaults);
      }
    },
    canDrop: ({ type }) => {
      return allowDrop && (!accept || type === accept);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [ accept, allowDrop, dispatch, dropBehaviour, keypath,
        dropItemDefaults ]);

  return (
    <div className="drop-target__wrapper" ref={drop}>
      <NodeQueryList
        keypath={keypath}
        ref={nodeListRef}
        { ...props }
      />
      <div className="drop-target">
        <div className={classNames('drop-target__overlay', {
          'drop-target__overlay--hovered': isOver && canDrop
        })}/>
      </div>
    </div>
  );
}

export default DroppableNodeQueryList;
