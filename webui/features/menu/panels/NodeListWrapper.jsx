import React from 'react';
import { useState, useCallback, useEffect, useRef, useImperativeHandle,
         Fragment, forwardRef } from 'react';
import { useDispatch } from 'react-redux';
import { useDrag } from 'react-dnd';
import { renderToStaticMarkup } from 'react-dom/server';

import { BTN_ADD } from 'constants/Icons';

import NewItem from 'features/common/NewItem';
import SidebarSection from 'features/common/SidebarSection';
import InlineBtn from 'features/common/buttons/InlineBtn';
import IconSvg from 'features/topology/icons/IconSvg';

import { bodyOverlayToggled } from 'features/nso/nsoSlice';
import { connectPngDragPreview } from 'features/topology/DragLayerCanvas';
import { useIconSize } from 'features/topology/LayoutContext';
import { itemDragged } from 'features/topology/topologySlice';

import { useCreateMutation } from 'api/data';


const NodeListWrapper = forwardRef(function NodeListWrapper({
  title, label, keypath, fetching, disableCreate, newItemDefaults,
  newItemDragType, newItemDragIcon, defaultsPath, headerActions,
  children, ...rest
}, ref) {
  console.debug('NodeListWrapper Render');

  const [ newItemOpen, setNewItemOpen ] = useState(false);
  const [ itemDefaults, setItemDefaults ] = useState();

  const dispatch = useDispatch();
  const [ create ] = useCreateMutation();
  const btnRef = useRef(null);
  const iconSize = useIconSize();

  const createNewItem = useCallback(async (name) => {
    await create({ name, keypath, ...rest });
    return name;
  }, [ create, keypath, rest ]);

  useImperativeHandle(ref, () => ({
    openNewItem(defaults) {
      setItemDefaults(defaults);
      setNewItemOpen(true);
      dispatch(bodyOverlayToggled(true));
    },
    createNewItem
  }), [ createNewItem, dispatch ]);

  const openNewItem = useCallback(() => {
    setItemDefaults(undefined);
    setNewItemOpen(true);
    dispatch(bodyOverlayToggled(true));
  }, [ dispatch ]);

  const closeNewItem = useCallback(() => {
    setNewItemOpen(false);
    dispatch(bodyOverlayToggled(false));
  }, [ dispatch ]);

  const [ , drag, dragPreview ] = useDrag(() => ({
    type: newItemDragType || 'UNDEFINED',
    item: () => {
      dispatch(itemDragged({ icon: 'new-item' }));
      return ({ icon: 'new-item' });
    },
    end: (item, monitor) => {
      dispatch(itemDragged(undefined));
      if (monitor.didDrop()) {
        openNewItem();
        setItemDefaults(monitor.getDropResult()?.itemDefaults);
      }
    },
    canDrag: newItemDragType !== undefined
  }));

  useEffect(() => {
    newItemDragIcon && connectPngDragPreview(renderToStaticMarkup(
      <IconSvg type={newItemDragIcon} size={iconSize} />),
      iconSize, dragPreview, true);
  }, [ iconSize, newItemDragIcon ]);

  const defaults = itemDefaults ?? newItemDefaults;

  return (
    <SidebarSection
      title={title}
      fetching={fetching}
      headerActions={
        <Fragment>
          {!disableCreate &&
            <Fragment>
              {drag(<div><InlineBtn
                ref={btnRef}
                icon={BTN_ADD}
                classSuffix="create"
                tooltip={`Add New ${label}${newItemDragType ? ' (drag me)' : ''}`}
                onClick={openNewItem}
              /></div>)}
              <NewItem
                btnRef={btnRef}
                path={keypath}
                label={`${label} Name`}
                isOpen={newItemOpen}
                close={closeNewItem}
                defaults={defaults}
                defaultsPath={defaultsPath}
              />
            </Fragment>
          }
          {headerActions}
        </Fragment>
      }
    >
      {children}
    </SidebarSection>
  );
});

export default NodeListWrapper;
