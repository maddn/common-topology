import React, { memo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { BTN_CONFIRM } from 'constants/Icons';

import { useMcpRequestMutation } from 'api/mcp';

import Accordion from 'features/common/Accordion';
import InlineBtn from 'features/common/buttons/InlineBtn';

import { itemAdded, viewerVisibleSet } from '../mcpSlice';


const ItemBase = memo(function ItemBase({
  title, isOpen, fade, toggle, children, request, disabled
}) {
  console.debug('ItemBase Render');

  const dispatch = useDispatch();
  const [ running, setRunning ] = useState(false);
  const [ executeMcpRequest ] = useMcpRequestMutation();

  const output = value => {
    dispatch(viewerVisibleSet(true));
    dispatch(itemAdded(value));
  };

  const run = async (event) => {
    event.stopPropagation();

    if (disabled || !request) {
      return;
    }

    try {
      setRunning(true);
      output({
        ...request,
        type: 'mcp-request'
      });
      const result = await executeMcpRequest(request).unwrap();
      output({
        ...request,
        result,
        type: 'mcp-response'
      });
    } catch (error) {
      output({
        ...request,
        error: error.message || error.error || JSON.stringify(error),
        type: 'mcp-response'
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Accordion
      level={2}
      isOpen={isOpen}
      variableHeight={true}
      fade={fade}
      toggle={toggle}
      title={title}
      isFetching={running}
      trailingActions={request &&
        <InlineBtn
          icon={BTN_CONFIRM}
          tooltip={`Run ${title}`}
          onClick={run}
          disabled={disabled}
        />}
    >
      {children &&
        <div className="content-group">
          {children}
        </div>}
    </Accordion>
  );
});

export default ItemBase;
