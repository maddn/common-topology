import React, { memo } from 'react';

import McpActivity from './McpActivity';


const removeConfigSentText = text => {
  const match = text.match(/\nconfig_sent:\s*/);
  return match
    ? text.slice(0, match.index).trim()
    : text;
};

const formatResult = result => {
  if (result.content?.length) {
    const textItems = result.content.map(item =>
      item.text !== undefined && item.text !== null
        ? removeConfigSentText(item.text)
        : undefined
    );
    return textItems.includes(undefined)
      ? undefined
      : textItems.join('\n\n');
  }
  return undefined;
};


const Tool = memo(function Tool({ request, response, active }) {
  console.debug('Tool Render');

  return (
    <McpActivity
      label="Tool"
      name={(request || response)?.params?.name}
      request={request}
      response={response}
      formatResult={formatResult}
      active={active}
    />
  );
});

export default Tool;
