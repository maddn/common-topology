import { createApi } from '@reduxjs/toolkit/query/react';
import { serverStatusSet } from 'features/mcp/mcpSlice';
import { getSystemSetting } from './index';

let nextRequestId = 1;
const initializePromises = new Map();

const getNsoUser = async api => {
  const currentUser =
    getSystemSetting.select('user')(api.getState()).data?.result;
  if (currentUser) {
    return currentUser;
  }

  const request = api.dispatch(getSystemSetting.initiate('user'));
  const result = await request;
  request.unsubscribe();
  return result.data?.result;
};

const isServerAvailableStatus = status =>
  status >= 400 && status < 500 && status !== 404;

const requestError = (message, serverAvailable = false) =>
  Object.assign(new Error(message), { serverAvailable });

const sortItems = (items = [], key) =>
  [ ...items ].sort((a, b) =>
    String(a[key] || '').localeCompare(String(b[key] || '')));

const buildRequest = (method, params = {}) => ({
  jsonrpc: '2.0',
  id: nextRequestId++,
  method,
  params
});

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

const request = async (method, params = {}, authHeader) => {
  if (!authHeader) {
    throw requestError(`Missing MCP auth for ${method}`);
  }

  let response;
  try {
    response = await fetch('/mcp', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildRequest(method, params))
    });
  } catch (error) {
    throw requestError(error.message);
  }
  const data = await responseBody(response);
  if (!response.ok) {
    const message = data.error?.message || data.error || response.statusText;
    throw requestError(
      `${response.status} ${message}`,
      isServerAvailableStatus(response.status)
    );
  }
  if (data.error) {
    const message = data.error?.message || data.error || response.statusText;
    throw requestError(`${response.status} ${message}`, true);
  }
  return data.result;
};

const initialize = authHeader => {
  if (!initializePromises.has(authHeader)) {
    initializePromises.set(authHeader, request('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: {
        name: 'common-topology-ui',
        version: '1.0'
      }
    }, authHeader).catch(error => {
      initializePromises.delete(authHeader);
      throw error;
    }));
  }
  return initializePromises.get(authHeader);
};

const mcpBaseQuery = () => async ({ method, params = {} }, api) => {
  try {
    const username = await getNsoUser(api);
    if (!username) {
      throw requestError(`Missing MCP auth for ${method}`);
    }

    const authHeader = 'Basic ' + btoa(`${username}:${username}`);
    await initialize(authHeader);
    const data = await request(method, params, authHeader);
    api.dispatch(serverStatusSet('ok'));
    return { data };
  } catch (error) {
    api.dispatch(serverStatusSet(
      error.serverAvailable ? 'ok' : 'error'
    ));
    throw new Error(`MCP request failed: ${error.message}`);
  }
};

export const mcpApi = createApi({
  reducerPath: 'mcpApi',
  baseQuery: mcpBaseQuery(),
  tagTypes: [ 'capabilities' ],
  endpoints: (build) => ({

    tools: build.query({
      query: () => ({ method: 'tools/list' }),
      transformResponse: response => sortItems(response.tools, 'name'),
      providesTags: [ 'capabilities' ]
    }),

    resources: build.query({
      query: () => ({ method: 'resources/list' }),
      transformResponse: response => sortItems(response.resources, 'uri'),
      providesTags: [ 'capabilities' ]
    }),

    resourceTemplates: build.query({
      query: () => ({ method: 'resources/templates/list' }),
      transformResponse: response =>
        sortItems(response.resourceTemplates, 'uriTemplate'),
      providesTags: [ 'capabilities' ]
    }),

    prompts: build.query({
      query: () => ({ method: 'prompts/list' }),
      transformResponse: response => sortItems(response.prompts, 'name'),
      providesTags: [ 'capabilities' ]
    }),

    mcpRequest: build.mutation({
      query: request => request
    })
  })
});

export const {
  useToolsQuery,
  useResourcesQuery,
  useResourceTemplatesQuery,
  usePromptsQuery,
  useMcpRequestMutation
} = mcpApi;

const {
  endpoints: {
    tools,
    resources,
    resourceTemplates,
    prompts
  }
} = mcpApi;

export const {
  useQueryState: useToolsQueryState
} = tools;

export const {
  useQueryState: useResourcesQueryState
} = resources;

export const {
  useQueryState: useResourceTemplatesQueryState
} = resourceTemplates;

export const {
  useQueryState: usePromptsQueryState
} = prompts;
