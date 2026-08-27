import { useCallback } from 'react';

import { useCreateMutation, useDeletePathMutation,
         useSetValueMutation } from './data';


const isObject = value =>
  value && typeof value === 'object' && !Array.isArray(value);

export function useLoadJsonConfig() {
  const [ create ] = useCreateMutation();
  const [ setValue ] = useSetValueMutation();

  return useCallback(async config => {
    const createNodes = async (parentPath, container, parentName) => {
      for (const [ nodeName, node ] of Object.entries(container)) {
        const keypath = `${parentPath}/${nodeName}`;
        if (Array.isArray(node)) {
          for (const item of node) {
            if (isObject(item)) {
              const { name, ...children } = item;
              await create({
                keypath,
                name,
                ...(parentName && { parentName })
              }).unwrap();
              await createNodes(`${keypath}{${name}}`, children, name);
            } else {
              await create({
                keypath,
                name: item,
                ...(parentName && { parentName })
              }).unwrap();
            }
          }
        } else if (isObject(node)) {
          await createNodes(keypath, node, parentName);
        } else {
          await setValue({
            keypath: parentPath,
            leaf: nodeName,
            value: node
          }).unwrap();
        }
      }
    };

    for (const [ parentPath, container ] of Object.entries(config)) {
      await createNodes(parentPath, container);
    }
  }, [ create, setValue ]);
}

export function useDeleteJsonConfig() {
  const [ deletePath ] = useDeletePathMutation();

  return useCallback(async configs => {
    const deleted = new Set();

    const deleteNodes = async (parentPath, container) => {
      for (const [ nodeName, node ] of Object.entries(container)) {
        const keypath = `${parentPath}/${nodeName}`;
        if (Array.isArray(node)) {
          for (const item of node) {
            const name = isObject(item) ? item.name : item;
            const itemPath = `${keypath}{${name}}`;
            if (isObject(item)) {
              await deleteNodes(itemPath, item);
            }
            if (!deleted.has(itemPath)) {
              deleted.add(itemPath);
              await deletePath({ keypath: itemPath }).unwrap();
            }
          }
        } else if (isObject(node)) {
          await deleteNodes(keypath, node);
        }
      }
    };

    for (const config of configs) {
      for (const [ parentPath, container ] of Object.entries(config)) {
        await deleteNodes(parentPath, container);
      }
    }
  }, [ deletePath ]);
}
