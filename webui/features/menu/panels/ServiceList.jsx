import React from 'react';

import NodeListWrapper from './NodeListWrapper';
import Accordion from 'features/common/Accordion';

import { useQueryState as _useQueryState, selectItem } from 'api/query';

export function useQueryState(path, stackedPath, queryKey) {
  const queryState = _useQueryState(path, queryKey);
  const stackedQueryState = _useQueryState(stackedPath || path, queryKey);
  return (queryState === 'Error' || stackedQueryState === 'Error') ? 'Error' :
         (queryState === 'OK' && stackedQueryState === 'OK') ? 'OK' : '';
}

export function useData(
  useQuery, selectorValue, suffix, selectorKey='name', selectorKeyStacked='name'
) {
  const { data } = useQuery(selectItem(selectorKeyStacked, selectorValue), true);
  const { data: serviceData } = useQuery(selectItem(selectorKey, selectorValue));

  // Stacked values display from the upper service, but operations should use
  // the generated lower service when NSO has created it.
  return [
    data && Object.keys(data).length > 0 ? data : serviceData,
    serviceData?.keypath || `${data?.keypath}${suffix ? `/${suffix}` : ''}/..`
  ];
}

export function ServiceList({
  module, stackedModule, contextName, ...props
}) {
  console.debug('ServiceList Render');

  // Project models use a 1:1 mapping from context name to stacked service key.
  // The stacked service may be the context itself, or a separate service keyed
  // by the context.
  const { data: stackedService } = stackedModule.useQuery(
    selectItem('name', contextName));
  const hasStackedService = stackedService !== undefined;
  const stackedItems = module.useQuery(undefined, true).data;
  const serviceItems = module.useQuery().data;
  // Stacked/input items come first so they provide the displayed values when
  // the same service also exists as a generated lower service.
  const services = serviceItems && stackedItems?.concat(serviceItems);

  const getContextName = module.getContextName || (item => item.topology);
  const getServiceName = module.getServiceName || (item => item.name);

  return (
    <NodeListWrapper
      title={module.title || `${module.label}s`}
      label={module.label}
      keypath={hasStackedService
        ? `${stackedModule.path}{${contextName}}/${module.service}`
        : module.path}
      fetching={module.useFetchStatus()}
      newItemDefaults={!hasStackedService && module.newItemContextLeaf &&
        [ { path: module.newItemContextLeaf, value: contextName } ]}
      {...props}
    >
      {[...new Set(services?.map(getContextName))].map(
        context =>
          <div key={context}>
            <Accordion
              isOpen={context === contextName}
              variableHeight={true}
            >
              {services.filter((service, index) =>
                getContextName(service) === context &&
                services.findIndex(item =>
                  getServiceName(item) == getServiceName(service) &&
                  getContextName(item) == getContextName(service)
                ) === index).map(service =>
                  <module.Component
                    key={getServiceName(service)}
                    name={getServiceName(service)}
                  />
                )}
            </Accordion>
          </div>
      )}
    </NodeListWrapper>
  );
}

export default ServiceList;
