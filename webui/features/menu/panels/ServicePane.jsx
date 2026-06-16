import React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { COMMIT_MANAGER_URL } from 'constants/Layout';
import * as IconTypes from 'constants/Icons';

import NodePane from './NodePane';
import InlineBtn from 'features/common/buttons/InlineBtn';

import { getOpenService, setOpenService,
         setConfigReferences } from '../menuSlice';
import { highlightedIconsUpdated } from 'features/topology/topologySlice';

import { stopThenGoToUrl } from 'api/comet';
import { useActionMutation, useGetValueQuery } from 'api/data';


function ServicePane({
  keypath, serviceKeypath = keypath, parentServiceKeypath, configReferences,
  children, title, label, disableRedeploy,
  isOpen: controlledIsOpen,
  fade: controlledFade,
  toggled: controlledToggle,
  ...rest
}) {
  console.debug('ServicePane Render');

  // See ../README.md for the sidebar path model. keypath is the
  // config-editor/data path; serviceKeypath is the service-operation path.
  const queryPath = serviceKeypath.endsWith('/..')
      ? serviceKeypath.substring(0,
        serviceKeypath.lastIndexOf('/', serviceKeypath.length - 4))
      : serviceKeypath;

  const { data } = useGetValueQuery({
    keypath: `${queryPath}/modified/devices`,
    tag: 'device-list'
  });

  const serviceIsOpen = useSelector(
    state => getOpenService(state) === serviceKeypath);
  // Context selectors that are also services can control accordion state while
  // still using this component for service operations.
  const isOpen = controlledIsOpen ?? serviceIsOpen;
  const fade = useSelector(state => {
    const openService = getOpenService(state);
    return controlledFade ??
      (!!openService && openService !== parentServiceKeypath);
  });

  const highlightedIcons = useMemo(() => serviceIsOpen ? data : [],
    [ serviceIsOpen, data ]);

  const dispatch = useDispatch();
  const toggle = useCallback(() => {
    if (controlledToggle) {
      controlledToggle(keypath);
    } else if (serviceIsOpen && parentServiceKeypath) {
      dispatch(setOpenService(parentServiceKeypath));
    } else {
      dispatch(setOpenService(serviceIsOpen ? undefined : serviceKeypath));
    }
  }, [ dispatch, controlledToggle, keypath, serviceIsOpen,
    parentServiceKeypath, serviceKeypath ]);

  useEffect(() => serviceIsOpen && dispatch(
    highlightedIconsUpdated({ highlightedIcons })
  ), [ highlightedIcons ]);
  useEffect(() => serviceIsOpen && configReferences && dispatch(
    setConfigReferences(configReferences)
  ), [ serviceIsOpen, configReferences ]);

  const [ action ] = useActionMutation();
  const redeploy = useCallback(async (event) => {
    event.stopPropagation();
    await action({
      transType: 'read_write',
      path: `${serviceKeypath}/touch`
    });
    dispatch(stopThenGoToUrl(COMMIT_MANAGER_URL));
  }, [ action, dispatch, serviceKeypath ]);

  return (
    <NodePane
      keypath={keypath}
      title={title || label}
      underscore={serviceKeypath !== keypath}
      label={label}
      isOpen={isOpen}
      fade={fade}
      nodeToggled={toggle}
      extraButtons={!disableRedeploy &&
        <InlineBtn
          icon={IconTypes.BTN_REDEPLOY}
          classSuffix="redeploy"
          tooltip={`Redeploy (Touch) ${label}`}
          onClick={redeploy}
        />
      }
      {...rest}
    >
      {children}
    </NodePane>
  );
}

export default ServicePane;
