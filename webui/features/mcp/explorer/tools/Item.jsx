import React, { Fragment, memo, useMemo } from 'react';

import { useToolsQuery } from 'api/mcp';
import { createItemsSelector, selectItem } from 'api/query';

import Description from '../Description';
import InputList, { schemaInputs } from '../InputList';
import ItemBase from '../ItemBase';


export function useTools(names) {
  const selectTools = useMemo(() =>
    createItemsSelector('name', names), [ names ]);
  const { data: tools = [] } = useToolsQuery(undefined, {
    selectFromResult: selectTools
  });
  return tools;
}

export function useTool(name) {
  return useToolsQuery(undefined, {
    selectFromResult: selectItem('name', name)
  }).data;
}


const ToolItem = memo(function ToolItem({
  title, tool, isOpen, fade, toggle, onOutput, children,
  toolArguments = {}, readOnly, disabled, showInputs = false
}) {
  console.debug('ToolItem Render');

  const name = tool.name;
  const description = tool.description;
  const displayTitle = title || name;
  const request = !readOnly && {
    method: 'tools/call',
    params: {
      name,
      arguments: toolArguments
    }
  };

  const inputs = schemaInputs(
    tool.inputSchema?.properties,
    tool.inputSchema?.required
  );

  return (
    <ItemBase
      title={displayTitle}
      request={request}
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      onOutput={onOutput}
      disabled={disabled}
    >
        {displayTitle !== name &&
          <div className="content-group__row">
            <span className="content-group__row-label">Name:</span>
            <span className="content-group__row-value">{name}</span>
          </div>}
        <Description description={description} showTag={displayTitle === name} />
        {showInputs && <InputList inputs={inputs} />}
        <Fragment>
          {children}
        </Fragment>
    </ItemBase>
  );
});

export default ToolItem;
