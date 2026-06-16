# Sidebar Service Module Template

Service modules are project-local adapters between a YANG service model and the
common sidebar panels. They should keep model-specific path and field details
out of `ServiceList` and `ServicePane`.

## Standard Module Shape

Use this order unless the module has a clear reason to differ:

```jsx
import React from 'react';
import { useMemo } from 'react';

import ServicePane from 'features/menu/panels/ServicePane';
import DeviceList from 'features/menu/panels/DeviceList';

import { useQueryQuery, useMemoizeWhenFetched, swapLabels,
         createItemsSelector } from 'api/query';
import { useQueryState, useData } from 'features/menu/panels/ServiceList';

export const label = 'Example Service';
export const title = 'Examples';
export const service = 'example';
export const path = `/project:root/${service}`;
export const stackedPath = `/project:root/stacked-service/${service}`;
export const newItemContextLeaf = 'topology';

const childList = 'children/child';

const selection = {
  'leaf-one': 'Leaf One',
  'boolean(leaf-two)': 'Leaf Two'
};

function useServiceQueryState(suffix, queryKey) {
  return useQueryState(
    suffix ? `${path}/${suffix}` : path,
    suffix ? `${stackedPath}/${suffix}` : stackedPath,
    queryKey
  );
}

export function useQuery(itemSelector, stacked) {
  return useQueryQuery({
    xpathExpr: stacked ? stackedPath : path,
    selection: [
      stacked ? '../name' : 'name',
      'topology',
      ...Object.keys(selection)
    ]
  }, { selectFromResult: itemSelector });
}

export function useFetchStatus() {
  return useMemoizeWhenFetched({
    'Example Services': useServiceQueryState(),
    'Example Children': useServiceQueryState(childList)
  });
}

export function Component({ name }) {
  console.debug('Example Render');

  const [ data, serviceKeypath ] = useData(useQuery, name);
  const childSelector = useMemo(() =>
    createItemsSelector('parentName', name), [ name ]);

  if (!data) {
    return null;
  }

  const { keypath } = data;

  return (
    <ServicePane
      key={name}
      title={name}
      label={label}
      keypath={keypath}
      serviceKeypath={serviceKeypath}
      { ...swapLabels(data, selection) }
    >
      <DeviceList
        label="Child"
        keypath={`${keypath}/${childList}`}
        select={[ '.', '../name' ]}
        selector={childSelector}
      />
    </ServicePane>
  );
}
```

## Contract

- `label` is the singular service label used by panes, buttons, and tooltips.
- `title` is optional and only overrides the `ServiceList` header; otherwise
  the header is `${label}s`.
- `path` is the direct/lower service query path. Build it from `service` where
  the YANG path matches the local service node name.
- `stackedPath` is the stacked/input service query path. Build it from
  `service` where the YANG path matches the local service node name.
- `service` is the child node name used when creating a new stacked item.
- `useQuery(selector, stacked)` must return the same logical fields for both
  stacked and direct data. If the YANG leaf paths differ, normalize in the
  module.
- `useFetchStatus()` should include the service path and any child lists the
  pane renders.
- `Component` should display stacked/input data when present, but pass the
  generated lower service path as `serviceKeypath` when that lower service
  exists.
- If the generated lower service does not exist yet, use the current `/..`
  fallback via `useData`.
- Parent stacked services that represent multiple lower services should compose
  `configReferences` locally from imported child module paths.

## Special Cases

Context selector modules, such as topology and tenant, do not need to follow the
full service-list contract. They should still expose `label`, `path`,
`useQuery`, and `useFetchStatus`.

Singleton service views, such as Base Config and IP Connectivity, may be
rendered directly by a context selector instead of through `ServiceList`. They
should still use `ServicePane` and the same `keypath` / `serviceKeypath`
semantics.
