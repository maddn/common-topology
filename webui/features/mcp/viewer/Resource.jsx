import React, { memo } from 'react';

import McpActivity from './McpActivity';


const removePrivateNodes = value => {
  if (Array.isArray(value)) {
    return value.map(removePrivateNodes);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([ key ]) => key.split(':').pop() !== 'private')
      .map(([ key, item ]) => [ key, removePrivateNodes(item) ]));
  }

  return value;
};

const formatResult = result => {
  if (result.contents?.length) {
    const textItems = result.contents.map(item => {
      if (item.text === undefined || item.text === null) {
        return undefined;
      }

      try {
        return JSON.stringify(
          removePrivateNodes(JSON.parse(item.text)), null, 2);
      } catch {
        return item.text;
      }
    });

    return textItems.includes(undefined)
      ? undefined
      : textItems.join('\n\n');
  }
  return undefined;
};


const Resource = memo(function Resource({ request, response, active }) {
  console.debug('Resource Render');

  return (
    <McpActivity
      label="Resource"
      name={(request || response)?.params?.uri}
      request={request}
      response={response}
      formatResult={formatResult}
      active={active}
    />
  );
});

export default Resource;
