import { useSelector } from 'react-redux';

import { removeKeys } from 'api/query';
import { getOpenContext, getOpenService } from 'features/menu/menuSlice';
import { getExpandedIcons } from 'features/topology/topologySlice';


const extractMcpServiceName = keypath =>
  keypath?.match(/\{([^}]+)\}/)?.[1];

const normalizeMcpPath = path =>
  path && removeKeys(path).replace(/\/\.\.$/, '');

const matchesMcpSchemaPath = (path, schemaPath) =>
  path ? normalizeMcpPath(schemaPath) === normalizeMcpPath(path) : false;

const matchesMcpSchema = (path, schema) =>
  matchesMcpSchemaPath(path, schema.path) ||
  matchesMcpSchemaPath(path, schema.selectionPath);

export function useMcpDevice() {
  return useSelector(state => {
    const expandedIcons = getExpandedIcons(state) || [];
    return expandedIcons.length === 1 ? expandedIcons[0] : undefined;
  });
}

export function getMcpServiceName(state, schema) {
  const path = schema.selectionSource === 'context'
    ? getOpenContext(state)
    : getOpenService(state);
  return matchesMcpSchema(path, schema) && extractMcpServiceName(path);
}

export function useMcpServiceName(schema) {
  return useSelector(state => getMcpServiceName(state, schema));
}
