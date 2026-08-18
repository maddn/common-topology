const assistantUrl = path =>
  `${location.protocol}//${location.hostname}:4001/mcp-assistant/${path}`;

const responseBody = async response => {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return { error: text };
  }
};

const parseStreamChunk = (buffer, onEvent) => {
  const lines = buffer.split('\n');
  const remainder = lines.pop();
  lines
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => onEvent(JSON.parse(line)));
  return remainder;
};

export const assistantStream = async ({
  message, context, think, onEvent
}) => {
  const response = await fetch(assistantUrl('chat-stream'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context, think })
  });

  if (!response.ok || !response.body) {
    const result = await responseBody(response);
    throw new Error(
      result.error || `Assistant request failed: ${response.status}`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let invalidateData = false;
  const handleEvent = event => {
    const { invalidateData: eventInvalidateData, ...viewerEvent } = event;
    if (eventInvalidateData) {
      invalidateData = true;
    }
    onEvent?.(viewerEvent);
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer = parseStreamChunk(
      buffer + decoder.decode(value, { stream: true }),
      handleEvent
    );
  }

  buffer = parseStreamChunk(buffer + decoder.decode(), handleEvent);

  return { invalidateData };
};
