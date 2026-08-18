import React, { Fragment, memo } from 'react';

import Item, { Text } from './Item';


const getResultText = (result, formatResult) => {
  if (result === undefined || result === null) {
    return '';
  }

  const text = formatResult?.(result);
  return text === undefined || text === null
    ? JSON.stringify(result, null, 2)
    : text;
};

const McpActivity = memo(function McpActivity({
  label, name, request, response, formatResult, active
}) {
  console.debug('McpActivity Render');

  const requestText = [
    request?.error && `Error: ${request.error}`,
    request?.method && `Method: ${request.method}`,
    name && `${label}: ${name}`
  ].filter(Boolean).join('\n');
  const requestArguments = request?.params?.arguments || request?.params || {};

  return (
    <Item
      title={`MCP ${label}`}
      header={name || ''}
      active={active}
    >
      {request && <Fragment>
        <div className="mcp-viewer__label">Request</div>
        <Text>
          {requestText}
        </Text>

        <div className="mcp-viewer__label">Arguments</div>
        <Text format="json">
          {JSON.stringify(requestArguments, null, 2)}
        </Text>
      </Fragment>}

      {response && <Fragment>
        <div className="mcp-viewer__label">Response</div>
        {response?.error
          ? <div className="mcp-viewer__text mcp-viewer__error">
              {response.error}
            </div>
          : <Text>
              {getResultText(response.result, formatResult)}
            </Text>}
      </Fragment>}
    </Item>
  );
});

export default McpActivity;
