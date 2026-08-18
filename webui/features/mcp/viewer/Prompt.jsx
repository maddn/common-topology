import React, { memo } from 'react';

import McpActivity from './McpActivity';


const promptContentText = content =>
  content?.text || JSON.stringify(content, null, 2);

const formatResult = result => {
  if (result.messages?.length) {
    return result.messages.map(message =>
      `${message.role}\n${promptContentText(message.content)}`
    ).join('\n\n');
  }
  return undefined;
};


const Prompt = memo(function Prompt({ request, response, active }) {
  console.debug('Prompt Render');

  return (
    <McpActivity
      label="Prompt"
      name={(request || response)?.params?.name}
      request={request}
      response={response}
      formatResult={formatResult}
      active={active}
    />
  );
});

export default Prompt;
