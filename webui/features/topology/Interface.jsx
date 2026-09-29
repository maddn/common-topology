import React from 'react';
import { memo, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useDrag } from 'react-dnd';
import { renderToStaticMarkup } from 'react-dom/server';

import { INTERFACE } from 'constants/ItemTypes';
import { SELECTED_CONNECTION } from 'constants/Colours';

import RoundButton from './RoundButton';

import { itemDragged, connectionSelected, iconSelected } from './topologySlice';
import { isSafari, connectPngDragPreview } from './DragLayerCanvas';


const Interface = memo(function Interface({
  keypath, aEndDevice, zEndDevice, fromDevice, x, y,
  onClick, pcX, pcY, type, size, active, disabled, tooltip
}) {
  console.debug('Interface Render');

  const dispatch = useDispatch();
  const mouseDownPos = useRef();

  const [ , drag, dragPreview ] = useDrag(() => ({
    type: INTERFACE,
    item: () => {
      const item = {
        interface: { keypath, aEndDevice, zEndDevice, fromDevice },
        x, y, mouseDownPos: mouseDownPos.current
      };
      requestAnimationFrame(() => {
        dispatch(itemDragged({ fromDevice, aEndDevice, zEndDevice }));
        dispatch(connectionSelected(undefined));
      });
      return item;
    },
    end: (_item, monitor) => {
      mouseDownPos.current = undefined;
      dispatch(itemDragged(undefined));
      if (!monitor.didDrop()) {
        (aEndDevice || zEndDevice)
          ? dispatch(connectionSelected({
              aEndDevice: aEndDevice || fromDevice,
              zEndDevice: zEndDevice || fromDevice }))
          : dispatch(iconSelected(fromDevice));
      }
    },
    canDrag: () => active && !disabled
  }), [
    active, aEndDevice, disabled, dispatch, fromDevice,
    keypath, x, y, zEndDevice
  ]);

  const handleMouseDown = event => {
    mouseDownPos.current = {
      x: event.clientX,
      y: event.clientY
    };
  };

  useEffect(() => {
    const actualSize = size * 2;

    // The drag preview is not captured correctly on Safari,
    // so draw a green circle instead.
    isSafari && connectPngDragPreview(renderToStaticMarkup(
      <svg
        width={`${actualSize}px`}
        height={`${actualSize}px`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${actualSize} ${actualSize}`}
      >
        <circle
          className="topology__svg-icon-circle"
          fill={SELECTED_CONNECTION}
          cx={actualSize/2} cy={actualSize/2} r={actualSize/2}
        />
      </svg>),
      actualSize, dragPreview, false
    );
  }, [ dragPreview, size ]);

  return (
    <RoundButton
      ref={drag}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      pcX={pcX}
      pcY={pcY}
      type={type}
      size={size}
      active={active}
      tooltip={tooltip}
    />
  );
});

export default Interface;
