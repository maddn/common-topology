import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

import promptTemplate from './prompt.txt';
import toolDefinitions from './tools.json' with {
  type: 'json'
};


const PROXY_PORT = 4001;
const NSO_BASE_URL = 'http://127.0.0.1:8080';
const ASSISTANT_SETTINGS_PATH =
  '/restconf/data/topologies/assistant?content=config&with-defaults=report-all';
const OLLAMA_REPLAY_DIR = '/tmp';
const MAX_TOOL_ROUNDS = 4;
const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*'
};

let nextMcpRequestId = 1;
let nextAssistantRequestId = 1;


class AssistantError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

class McpRequestRejected extends Error {}


const urlFor = (baseUrl, urlPath) =>
  `${String(baseUrl || '').replace(/\/+$/, '')}${urlPath}`;

const nsoBaseUrlForRequest = request => {
  try {
    const origin = new URL(request.headers.origin || '');
    return `${origin.protocol}//127.0.0.1${origin.port
      ? `:${origin.port}`
      : ''}`;
  } catch {
    return NSO_BASE_URL;
  }
};

const basicAuth = (username, password) =>
  `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

const jsonFromText = text => {
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

const modelUnavailable = (baseUrl, model) =>
  new AssistantError(
    `Assistant model is unavailable at ${baseUrl}. ` +
    `Start the local model runtime and make sure model "${model}" is ` +
    'available.',
    503
  );

const truncateJson = (value, maxLength = 12000) => {
  const text = JSON.stringify(value, null, 2);
  if (text === undefined) {
    return '';
  }

  return text.length <= maxLength
    ? text
    : `${text.slice(0, maxLength)}\n...truncated...`;
};

const unprefixedObject = value =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value)
      .map(([ key, item ]) => [ String(key || '').split(':').pop(), item ]))
    : {};

const assistantSettingsFromRestconf = data => {
  const responseData = unprefixedObject(data);
  const settings = unprefixedObject(responseData.assistant);
  const numThread = settings['num-thread'] && Number(settings['num-thread']);
  const debug = Boolean(settings.debug);
  const missing = [
    settings['ollama-base-url'] ? undefined : 'ollama-base-url',
    settings.model ? undefined : 'model'
  ].filter(Boolean);

  if (missing.length) {
    throw new AssistantError(
      'Assistant settings RESTCONF response is missing required values: ' +
      `${missing.join(', ')}.`,
      500
    );
  }

  return {
    ollamaBaseUrl: settings['ollama-base-url'],
    model: settings.model,
    ...(numThread
      ? { numThread }
      : {}),
    debugEnabled: debug
  };
};

const readAssistantSettings = async config => {
  let response;

  try {
    response = await fetch(
      urlFor(config.nsoBaseUrl, ASSISTANT_SETTINGS_PATH),
      {
        method: 'GET',
        headers: {
          Accept: 'application/yang-data+json',
          Authorization: basicAuth(config.nsoUsername, config.nsoPassword)
        }
      }
    );
  } catch (error) {
    console.error(error);
    throw new AssistantError(
      'Unable to read assistant settings from NSO.',
      503
    );
  }

  const responseText = await response.text();
  const data = jsonFromText(responseText);
  if (!response.ok || data.error) {
    console.error(`${response.status} ${response.statusText}`);
    console.error(responseText);
    throw new AssistantError(
      'Unable to read assistant settings from NSO.',
      response.ok ? 502 : response.status || 502
    );
  }

  return assistantSettingsFromRestconf(data);
};

const configForAssistantBody = (config, body = {}) => {
  const { context = {}, think } = body;
  const username = context.user;
  if (!username) {
    throw new AssistantError(
      'Current UI user is required before MCP requests can be made.',
      401
    );
  }

  return {
    ...config,
    nsoUsername: username,
    nsoPassword: username,
    ollamaThink: think === true
  };
};

const traceValue = value => {
  const text = Array.isArray(value)
    ? value.join(',')
    : String(value);
  return /\s/.test(text) ? JSON.stringify(text) : text;
};

const log = ({ requestId, event, details = {} }) => {
  const detailText = Object.entries(details)
    .filter(([, value ]) => value !== undefined && value !== null &&
      value !== '')
    .map(([ key, value ]) => `${key}=${traceValue(value)}`)
    .join(' ');
  console.log(
    `${new Date().toISOString()} [${requestId ?? '-'}] ${event}` +
    `${detailText ? ` ${detailText}` : ''}`
  );
};

const mcpRequest = async (config, method, params = {}) => {
  let response;

  try {
    response = await fetch(urlFor(config.nsoBaseUrl, '/mcp'), {
      method: 'POST',
      headers: {
        Authorization: basicAuth(config.nsoUsername, config.nsoPassword),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: nextMcpRequestId++,
        method,
        params
      })
    });
  } catch (error) {
    console.error(error);
    throw new AssistantError('Unable to reach NSO MCP server.', 503);
  }

  const responseText = await response.text();
  const data = jsonFromText(responseText);
  if (!response.ok || data.error) {
    console.error(`MCP ${method} failed: ` +
      `${response.status} ${response.statusText}`);
    console.error(responseText);
    throw new AssistantError(
      `MCP ${method} failed.`,
      response.ok ? 502 : response.status || 502
    );
  }

  return data.result;
};


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

const formatMcpResourceResult = result => {
  if (result?.contents?.length) {
    if (result.contents.every(item => item.text !== undefined &&
        item.text !== null)) {
      return result.contents.map(item => {
        try {
          return JSON.stringify(
            removePrivateNodes(JSON.parse(item.text)), null, 2);
        } catch {
          return item.text;
        }
      }).join('\n\n');
    }
  }

  return truncateJson(removePrivateNodes(result));
};

const attachSelectedServiceResource = async ({
  config, requestId, context, onEvent
}) => {
  const selectedService = context?.selectedService;
  if (!selectedService?.uri) {
    return context;
  }

  const { label, uri } = selectedService;
  const resourceRequest = {
    type: 'mcp-request',
    method: 'resources/read',
    params: { uri }
  };
  onEvent?.(resourceRequest);

  try {
    const result = await mcpRequest(config, 'resources/read', { uri });
    const resourceText = formatMcpResourceResult(result);
    onEvent?.({
      ...resourceRequest,
      type: 'mcp-response',
      result: {
        contents: [
          {
            mimeType: 'application/json',
            text: resourceText,
            uri
          }
        ]
      }
    });

    log({
      requestId,
      event: 'mcp_resource_attached',
      details: {
        label,
        uri,
        chars: resourceText.length
      }
    });

    return {
      ...context,
      selectedService: {
        ...selectedService,
        text: resourceText
      }
    };
  } catch (error) {
    onEvent?.({
      ...resourceRequest,
      type: 'mcp-response',
      error: error.message
    });
    log({
      requestId,
      event: 'mcp_resource_attach_error',
      details: {
        label,
        uri,
        error: error.message
      }
    });
    if (!(error instanceof AssistantError)) {
      console.error(error);
    }

    return {
      ...context,
      selectedService: {
        ...selectedService,
        error: error.message
      }
    };
  }
};


const chainableToolNames = definitions =>
  new Set(Object.entries(definitions || {})
    .filter(([, definition ]) => definition.chainable)
    .map(([ name ]) => name));

const selectedMcpTools = (definitions, advertisedToolNames) =>
  Object.entries(definitions || {})
    .map(([ name, definition ]) => {
      if (!definition?.inputSchema) {
        throw new AssistantError(
          `Missing assistant tool definition for ${name}.`,
          500
        );
      }

      return advertisedToolNames.has(name)
        ? {
          name,
          description: definition.description,
          inputSchema: definition.inputSchema
        }
        : undefined;
    })
    .filter(Boolean);

const toolCallArguments = toolCall => {
  const args = toolCall?.function?.arguments || toolCall?.arguments || {};
  if (typeof args === 'string') {
    try {
      return JSON.parse(args) || {};
    } catch {
      return {};
    }
  }
  return args;
};

const toolCallName = toolCall =>
  toolCall?.function?.name || toolCall?.name;

const describePath = argumentPath =>
  argumentPath || 'arguments';

const validateAgainstSchema = (value, schema = {}, argumentPath = '') => {
  const errors = [];

  if (schema.enum && value !== undefined && !schema.enum.includes(value)) {
    errors.push(
      `${describePath(argumentPath)} must be one of ${schema.enum.join(', ')}.`
    );
    return errors;
  }

  if (value === undefined || value === null) {
    return errors;
  }

  if (schema.type === 'object' || schema.properties) {
    if (typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${describePath(argumentPath)} must be an object.`);
      return errors;
    }

    const properties = schema.properties || {};
    const required = schema.required || [];
    required.forEach(key => {
      if (value[key] === undefined) {
        const description = properties[key]?.description;
        const pathName = argumentPath ? `${argumentPath}.${key}` : key;
        errors.push(
          `${describePath(pathName)} is required` +
          `${description ? `: ${description}` : ''}.`
        );
      }
    });

    Object.keys(value).forEach(key => {
      if (!properties[key]) {
        const pathName = argumentPath ? `${argumentPath}.${key}` : key;
        errors.push(
          `${describePath(pathName)} is not a valid input for this MCP tool.`
        );
        return;
      }
      errors.push(...validateAgainstSchema(
        value[key],
        properties[key],
        argumentPath ? `${argumentPath}.${key}` : key
      ));
    });
    return errors;
  }

  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${describePath(argumentPath)} must be an array.`);
      return errors;
    }
    value.forEach((item, index) => {
      errors.push(...validateAgainstSchema(
        item,
        schema.items || {},
        `${argumentPath}[${index}]`
      ));
    });
    return errors;
  }

  if (schema.type === 'string' && typeof value !== 'string') {
    errors.push(`${describePath(argumentPath)} must be a string.`);
  }
  if (schema.type === 'integer' && !Number.isInteger(value)) {
    errors.push(`${describePath(argumentPath)} must be an integer.`);
  }
  if (schema.type === 'number' && typeof value !== 'number') {
    errors.push(`${describePath(argumentPath)} must be a number.`);
  }
  if (schema.type === 'boolean' && typeof value !== 'boolean') {
    errors.push(`${describePath(argumentPath)} must be a boolean.`);
  }

  return errors;
};

const placeholderArgumentErrors = (value, argumentPath = '') => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return /^<[^>]+>$/.test(trimmed) ||
      /^(unknown|none|null|undefined|n\/a|example)$/i.test(trimmed)
      ? [
        `${describePath(argumentPath)} needs a concrete value, not "${value}".`
      ]
      : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      placeholderArgumentErrors(item, `${argumentPath}[${index}]`));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([ key, item ]) =>
      placeholderArgumentErrors(
        item,
        argumentPath ? `${argumentPath}.${key}` : key
      ));
  }

  return [];
};

const validateToolArguments = ({ tool, args }) => {
  const errors = [
    ...placeholderArgumentErrors(args),
    ...validateAgainstSchema(args, tool.inputSchema || {})
  ];
  if (errors.length) {
    throw new McpRequestRejected(
      `I need valid inputs for ${tool.name} before I can run it. ` +
      errors.slice(0, 4).join(' ')
    );
  }
};

const isMutationControlArgument = key =>
  key === 'name' ||
  key.startsWith('__key__') ||
  key.startsWith('__commit_') ||
  [ 'dry-run', 'dryRun', 'dry_run', 'outformat', 'format' ].includes(key);

const validateMutationHasPayload = ({ tool, args }) => {
  if (!/_(create|update)$/.test(tool.name || '')) {
    return;
  }

  const hasPayload = Object.keys(args || {}).some(key =>
    !isMutationControlArgument(key));
  if (!hasPayload) {
    throw new McpRequestRejected(
      `I need configuration values before I can run ${tool.name}. ` +
      'Please provide the values to create or update.'
    );
  }
};

const formatMcpToolResult = result => {
  if (result?.content?.length) {
    if (result.content.every(item => item.text !== undefined &&
        item.text !== null)) {
      return result.content.map(item => item.text).join('\n\n');
    }
  }

  return truncateJson(result);
};

const executeMcpTool = async ({
  config, requestId, toolsByName, name, args, onEvent, round
}) => {
  const tool = toolsByName.get(name);
  if (!tool) {
    throw new McpRequestRejected(
      `${name} is not currently exposed by the MCP server.`
    );
  }

  validateToolArguments({ tool, args });
  validateMutationHasPayload({ tool, args });

  const requestEvent = {
    type: 'mcp-request',
    method: 'tools/call',
    params: {
      name: tool.name,
      arguments: args
    },
    ...(round !== undefined ? { round } : {})
  };
  onEvent?.(requestEvent);

  let result;
  let errorMessage;
  let caughtError;
  try {
    result = await mcpRequest(config, 'tools/call', {
      name: tool.name,
      arguments: args
    });
  } catch (error) {
    caughtError = error;
    errorMessage = error.message || String(error);
  }

  if (caughtError) {
    log({
      requestId,
      event: 'mcp_tool_failed',
      details: {
        round,
        tool: tool.name,
        error: caughtError.message
      }
    });
    if (!(caughtError instanceof AssistantError)) {
      console.error(caughtError);
    }
  } else {
    log({
      requestId,
      event: 'mcp_tool_executed',
      details: {
        round,
        tool: tool.name,
        chars: formatMcpToolResult(result).length
      }
    });
  }

  const responseEvent = {
    ...requestEvent,
    type: 'mcp-response',
    ...(errorMessage ? { error: errorMessage } : { result })
  };
  onEvent?.({
    ...responseEvent,
    ...(!errorMessage && result !== undefined ? { invalidateData: true } : {})
  });
  return responseEvent;
};


const promptSection = (name, lines) =>
  [
    `<${name}>`,
    ...(Array.isArray(lines) ? lines : [ lines ]),
    `</${name}>`
  ].join('\n');

const fillPromptTemplate = (template, values) =>
  Object.entries(values).reduce(
    (content, [ name, value ]) =>
      content.replaceAll(`{{${name}}}`, value || ''),
    template
  ).replace(/\n{3,}/g, '\n\n').trim();

const selectedServiceDescription = resource =>
  `Selected ${resource.label} service configuration resource.`;

const primaryMcpResourceSection = resource =>
  resource?.uri
    ? promptSection('primary-mcp-resource', [
      'Attached current MCP resource snapshot.',
      '',
      `Resource: ${resource.uri}`,
      `Description: ${selectedServiceDescription(resource)}`,
      resource.error
        ? `Error: ${resource.error}`
        : [
          'Content:',
          resource.text || ''
        ].join('\n')
    ].filter(Boolean))
    : undefined;

const currentUiSelectionSection = context => {
  const selectedService = context?.selectedService;
  const selectedDevice = context?.selectedDevice;

  return promptSection('current-ui-selection', [
    selectedService?.name
      ? `Selected ${selectedService.label} service: ${selectedService.name}`
      : 'No service resource is selected.',
    selectedDevice
      ? `Selected device: ${selectedDevice}`
      : undefined
  ].filter(Boolean));
};

const writeOllamaDump = ({ config, requestId, round, kind, payload }) => {
  if (!config.debugEnabled ||
      requestId === undefined ||
      round === undefined) {
    return undefined;
  }

  const file = path.join(
    OLLAMA_REPLAY_DIR,
    `mcp-ollama-${kind}-${requestId}-round-${round}.json`
  );
  try {
    fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  } catch (error) {
    log({
      requestId,
      event: 'ollama_replay_write_failed',
      details: {
        kind,
        round,
        error: error.message
      }
    });
    console.error(error);
  }
};

const compactJsonText = text => {
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return undefined;
  }
};

const compactContentJsonBlock = content =>
  content.replace(
    /(Content:\n)([\s\S]*?)(?=\n\n|\n<\/|$)/g,
    (match, prefix, jsonText) => {
      const json = compactJsonText(jsonText.trim());
      return json ? `${prefix}${json}` : match;
    }
  );

const compactPayloadForModel = payload => ({
  ...payload,
  messages: payload.messages
    ? payload.messages.map(message => ({
      ...message,
      content: message.content === undefined
        ? message.content
        : compactContentJsonBlock(String(message.content || ''))
    }))
    : payload.messages
});

const mergeOllamaStreamChunks = chunks => {
  const lastChunk = chunks[chunks.length - 1] || {};
  const message = chunks.reduce((merged, chunk) => {
    const chunkMessage = chunk.message || {};
    const toolCalls = chunkMessage.tool_calls;

    return {
      ...merged,
      ...(chunkMessage.role ? { role: chunkMessage.role } : {}),
      ...(chunkMessage.content
        ? { content: `${merged.content || ''}${chunkMessage.content}` }
        : {}),
      ...(chunkMessage.thinking
        ? { thinking: `${merged.thinking || ''}${chunkMessage.thinking}` }
        : {}),
      ...(toolCalls?.length
        ? { tool_calls: [ ...(merged.tool_calls || []), ...toolCalls ] }
        : {})
    };
  }, {});

  return {
    ...lastChunk,
    message
  };
};

const readOllamaStream = async ({ response, onChunk }) => {
  const decoder = new TextDecoder();
  const chunks = [];
  const lines = [];
  let buffer = '';

  const handleLine = line => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    lines.push(trimmed);
    const chunk = JSON.parse(trimmed);
    chunks.push(chunk);
    onChunk?.(chunk);
  };

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const split = buffer.split('\n');
    buffer = split.pop();
    split.forEach(handleLine);
  }

  buffer += decoder.decode();
  handleLine(buffer);

  return {
    responseText: lines.join('\n'),
    result: mergeOllamaStreamChunks(chunks)
  };
};

const stripThinkingBlocks = content => {
  let stripped = String(content || '').replace(
    /<think>([\s\S]*?)<\/think>/gi,
    ''
  ).trim();

  const orphanCloseIndex = stripped.toLowerCase().indexOf('</think>');
  if (orphanCloseIndex !== -1) {
    stripped = stripped.slice(orphanCloseIndex + '</think>'.length).trim();
  }

  const orphanOpenIndex = stripped.toLowerCase().indexOf('<think>');
  if (orphanOpenIndex !== -1) {
    stripped = stripped.slice(0, orphanOpenIndex).trim();
  }

  return stripped;
};

const ollamaChat = async ({
  config, messages, tools, requestId, round, onThinking
}) => {
  const thinkingEnabled = config.ollamaThink === true;
  const requestPayload = {
    model: config.model,
    messages,
    stream: thinkingEnabled,
    options: {
      temperature: 0,
      ...(Number.isInteger(config.numThread)
        ? { num_thread: config.numThread }
        : {})
    },
    ...(tools?.length ? { tools } : {}),
    ...(thinkingEnabled ? { think: true } : {})
  };
  const compactRequestPayload = compactPayloadForModel(requestPayload);
  writeOllamaDump({
    config,
    requestId,
    round,
    kind: 'request',
    payload: compactRequestPayload
  });

  log({
    requestId,
    event: 'ollama_request',
    details: {
      round,
      model: config.model,
      toolCount: tools?.length || 0,
      numThread: config.numThread,
      thinking: config.ollamaThink
    }
  });

  let response;
  try {
    response = await fetch(urlFor(config.ollamaBaseUrl, '/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compactRequestPayload)
    });
  } catch (error) {
    console.error(error);
    throw modelUnavailable(config.ollamaBaseUrl, config.model);
  }

  let responseText;
  let result;
  if (thinkingEnabled && response.ok && response.body) {
    try {
      ({ responseText, result } = await readOllamaStream({
        response,
        onChunk: chunk => {
          if (chunk.message?.thinking) {
            onThinking?.(chunk.message.thinking);
          }
        }
      }));
    } catch (error) {
      console.error(error);
      throw new AssistantError(
        'Unable to read assistant model stream.',
        502
      );
    }
  } else {
    responseText = await response.text();
    if (!responseText) {
      result = {};
    } else {
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { error: responseText };
      }
    }
  }

  writeOllamaDump({
    config,
    requestId,
    round,
    kind: 'response',
    payload: {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      body: responseText,
      parsed: result
    }
  });

  if (!response.ok) {
    console.error(`${response.status} ${response.statusText}`);
    console.error(responseText);
    throw modelUnavailable(config.ollamaBaseUrl, config.model);
  }

  if (!result.message) {
    throw new AssistantError(
      'Model response did not include an assistant message.',
      502
    );
  }

  const { content, thinking, ...message } = result.message;

  return {
    ...message,
    ...(content !== undefined ? { content: stripThinkingBlocks(content) } : {}),
    prompt_eval_count: result.prompt_eval_count,
    total_duration: result.total_duration,
    prompt_eval_duration: result.prompt_eval_duration
  };
};

const usageFromResponse = ({ round, response }) => ({
  round,
  promptEvalCount: response.prompt_eval_count,
  totalDurationMs: response.total_duration &&
    Math.round(response.total_duration / 1e6),
  promptEvalDurationMs: response.prompt_eval_duration &&
    Math.round(response.prompt_eval_duration / 1e6)
});

const usageText = usage => {
  const rounds = usage?.rounds || [];
  if (!rounds.length) {
    return undefined;
  }

  const firstRound = rounds[0];
  const formatCount = value => {
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return value >= 1000
      ? `${(value / 1000).toFixed(1)}k`
      : String(value);
  };
  const formatDuration = value => {
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return value >= 1000
      ? `${(value / 1000).toFixed(1)}s`
      : `${value}ms`;
  };
  const totalPromptTime = rounds.reduce((sum, round) =>
    sum + (round.promptEvalDurationMs || 0), 0);
  const totalModelTime = rounds.reduce((sum, round) =>
    sum + (round.totalDurationMs || 0), 0);
  const promptCount = formatCount(firstRound.promptEvalCount);
  const promptDuration = formatDuration(totalPromptTime);
  const modelDuration = formatDuration(totalModelTime);

  return [
    promptCount && `context ${promptCount} tokens`,
    promptDuration && `eval ${promptDuration}`,
    modelDuration && `response ${modelDuration}`,
    rounds.length > 1 && `${rounds.length} rounds`
  ].filter(Boolean).join(' · ');
};

const toolEnabledOllamaLoop = async ({
  config, requestId, message, context, onEvent
}) => {
  const toolsResult = await mcpRequest(config, 'tools/list');
  const advertisedToolNames = new Set(
    (toolsResult.tools || []).map(tool => tool.name)
  );
  const selectedTools = selectedMcpTools(toolDefinitions, advertisedToolNames);
  const chainableTools = chainableToolNames(toolDefinitions);
  const toolsByName = new Map(selectedTools.map(tool => [ tool.name, tool ]));
  const ollamaTools = selectedTools.map(({
    name, description, inputSchema
  }) => ({
    type: 'function',
    function: {
      name,
      description: description || name,
      parameters: inputSchema
    }
  }));

  log({
    requestId,
    event: 'mcp_tools_listed',
    details: {
      advertised: advertisedToolNames.size,
      selected: selectedTools.length
    }
  });

  let chatMessages = [
    {
      role: 'system',
      content: fillPromptTemplate(promptTemplate, {
        CURRENT_UI_SELECTION: currentUiSelectionSection(context),
        PRIMARY_MCP_RESOURCES: primaryMcpResourceSection(
          context?.selectedService
        )
      })
    },
    {
      role: 'user',
      content: message
    }
  ];
  let toolsAvailable = true;
  const usageRounds = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const toolsForRound = toolsAvailable ? ollamaTools : undefined;
    let thinkingStarted = false;
    const response = await ollamaChat({
      config,
      messages: chatMessages,
      tools: toolsForRound,
      requestId,
      round,
      onThinking: delta => {
        if (!String(delta || '')) {
          return;
        }
        if (!thinkingStarted) {
          thinkingStarted = true;
          onEvent?.({
            type: 'model-thinking',
            collapsed: true
          });
        }
        onEvent?.({
          type: 'model-thinking-delta',
          text: delta
        });
      }
    });
    const usage = usageFromResponse({ round, response });
    usageRounds.push(usage);

    log({
      requestId,
      event: 'ollama_response',
      details: {
        round,
        toolCalls: (response.tool_calls || []).length,
        contentChars: String(response.content || '').length
      }
    });

    const responseToolCalls = response.tool_calls || [];
    if (!responseToolCalls.length) {
      const content = String(response.content || '').trim();
      const messageText = content ||
        'The assistant model returned an empty response before calling a ' +
        'tool. ' +
        'Please retry the request.';
      return {
        message: messageText,
        usage: { rounds: usageRounds }
      };
    }

    chatMessages = [
      ...chatMessages,
      {
        role: 'assistant',
        content: response.content || '',
        tool_calls: responseToolCalls
      }
    ];

    for (const responseToolCall of responseToolCalls) {
      const name = toolCallName(responseToolCall);
      const args = toolCallArguments(responseToolCall);

      let toolCall;
      try {
        toolCall = await executeMcpTool({
          config,
          requestId,
          toolsByName,
          name,
          args,
          onEvent,
          round
        });
      } catch (error) {
        if (error instanceof McpRequestRejected) {
          log({
            requestId,
            event: 'mcp_request_rejected',
            details: {
              round,
              tool: name,
              message: error.message
            }
          });
          onEvent?.({
            type: 'mcp-request',
            method: 'tools/call',
            params: {
              name,
              arguments: args
            },
            ...(round !== undefined ? { round } : {}),
            error: error.message
          });
          return {
            message: error.message,
            usage: { rounds: usageRounds }
          };
        }
        throw error;
      }

      if (!chainableTools.has(toolCall.params?.name)) {
        toolsAvailable = false;
      }
      chatMessages = [
        ...chatMessages,
        {
          role: 'tool',
          tool_name: toolCall.params?.name,
          content: toolCall.error || formatMcpToolResult(toolCall.result)
        }
      ];
    }
  }

  return {
    message: 'The assistant made too many MCP calls without producing a ' +
      'final answer.',
    usage: { rounds: usageRounds }
  };
};

const handleAssistantRequest = async ({ config, body, onEvent }) => {
  const requestId = nextAssistantRequestId++;
  const message = body?.message?.trim();
  let effectiveConfig = config;

  try {
    if (!message) {
      throw new AssistantError('Message is required.', 400);
    }

    const mcpConfig = configForAssistantBody(config, body);
    effectiveConfig = mcpConfig;
    log({
      requestId,
      event: 'assistant_request',
      details: {
        user: mcpConfig.nsoUsername,
        messageChars: message.length,
        thinking: mcpConfig.ollamaThink
      }
    });
    const assistantSettings = await readAssistantSettings(mcpConfig);
    effectiveConfig = {
      ...mcpConfig,
      ...assistantSettings
    };

    log({
      requestId,
      event: 'assistant_settings_loaded',
      details: {
        model: effectiveConfig.model,
        ollamaBaseUrl: effectiveConfig.ollamaBaseUrl,
        numThread: effectiveConfig.numThread,
        debug: effectiveConfig.debugEnabled
      }
    });

    await mcpRequest(effectiveConfig, 'initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: {
        name: 'tme-demo-ui-assistant',
        version: '0.1.0'
      }
    });

    const context = await attachSelectedServiceResource({
      config: effectiveConfig,
      requestId,
      context: body?.context,
      onEvent
    });

    const response = await toolEnabledOllamaLoop({
      config: effectiveConfig,
      requestId,
      message,
      context,
      onEvent
    });

    log({
      requestId,
      event: 'assistant_request_complete',
      details: {
        meta: usageText(response.usage)
      }
    });

    return response;
  } catch (error) {
    log({
      requestId,
      event: 'assistant_error'
    });
    if (!(error instanceof AssistantError)) {
      console.error(error);
    }
    throw error;
  }
};


const writeStreamHeaders = response => {
  response.writeHead(200, {
    ...CORS_HEADERS,
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'application/x-ndjson'
  });
  response.flushHeaders?.();
};

const writeStreamEvent = (response, event) => {
  response.write(`${JSON.stringify(event)}\n`);
  response.flush?.();
};

const assistantStreamResponse = async ({ config, body, response }) => {
  writeStreamHeaders(response);
  const keepalive = setInterval(() => {
    writeStreamEvent(response, {
      keepalive: true,
      time: new Date().toISOString()
    });
  }, 10000);

  try {
    const result = await handleAssistantRequest({
      config,
      body,
      onEvent: event => writeStreamEvent(response, event)
    });
    const meta = usageText(result.usage);
    writeStreamEvent(response, {
      type: 'assistant',
      ...(meta ? { meta } : {}),
      ...(result.message ? { text: result.message } : {})
    });
  } catch (error) {
    writeStreamEvent(response, {
      type: 'assistant',
      status: error.status || 500,
      error: error.message
    });
  } finally {
    clearInterval(keepalive);
    response.end();
  }
};

const readBody = request =>
  new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', chunk => chunks.push(chunk));
    request.on('error', reject);
    request.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(text));
      } catch (error) {
        console.error(error);
        reject(new AssistantError('Request body must be valid JSON.', 400));
      }
    });
  });

const writeJson = (response, status, body) => {
  response.writeHead(status, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json'
  });
  response.end(JSON.stringify(body));
};

export function createAssistantServer() {
  return http.createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
      writeJson(response, 204, {});
      return;
    }

    if (request.method !== 'POST' ||
        request.url !== '/mcp-assistant/chat-stream') {
      writeJson(response, 404, { error: 'Not found.' });
      return;
    }

    try {
      const body = await readBody(request);
      const config = {
        nsoBaseUrl: nsoBaseUrlForRequest(request)
      };
      await assistantStreamResponse({ config, body, response });
    } catch (error) {
      log({
        event: 'assistant_error'
      });
      if (!(error instanceof AssistantError)) {
        console.error(error);
      }
      writeJson(response, error.status || 500, { error: error.message });
    }
  });
}

if ([ 'assistant-proxy.mjs', 'assistant-proxy.js' ].includes(
  path.basename(process.argv[1] || '')
)) {
  createAssistantServer().listen(PROXY_PORT, () => {
    log({
      event: 'assistant_proxy_started',
      details: { port: PROXY_PORT }
    });
  });
}

export default createAssistantServer;
