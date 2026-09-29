import React from 'react';
import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useResizeDetector } from 'react-resize-detector';

import Container from './Container';
import Connection, { useTopologyConnectionsQuery } from './Connection';
import Icon, { useTopologyDevicesQuery, useTopologyZoomedIconsQuery,
               usePlatformsQuery } from './Icon';
import DragLayerCanvas from './DragLayerCanvas';
import CustomDragLayer from './CustomDragLayer';
import LoadingOverlay from '../common/LoadingOverlay';

import { LayoutContextProvider, getZoomedContainers,
         useLayoutQuery, useZoomedLayoutQuery } from './LayoutContext';
import { dimensionsChanged } from './topologySlice';
import { fetchStatus } from 'api/query';


const TopologyBody = React.memo(function TopologyBody ({ getDeviceStatus }) {
  console.debug('TopologyBody Render');

  const dispatch = useDispatch();

  const ref = useRef(null);
  const canvasRef = useRef();

  const layout = useLayoutQuery();
  const zoomedLayout = useZoomedLayoutQuery();
  const devices = useTopologyDevicesQuery();
  const zoomedIcons = useTopologyZoomedIconsQuery();
  const connections = useTopologyConnectionsQuery();
  const platforms = usePlatformsQuery();

  const resize = useCallback(() => {
    console.debug('Topology Resize');
    if (!ref.current) {
      return;
    }
    const { offsetWidth: width, offsetHeight: height } = ref.current;
    const { left, top } = ref.current.getBoundingClientRect();
    dispatch(dimensionsChanged({ width, height, left, top }));
  }, [ dispatch ]);

  useResizeDetector({
    targetRef: ref,
    onResize: resize,
    handleWidth: true,
    handleHeight: true,
    refreshMode: 'debounce',
    refreshRate: 500,
    disableRerender: true
  });

  return (
    <LayoutContextProvider>
      <div className="topology">
        <div className="header">
          <span className="header__title-text">Select a topology...</span>
        </div>
        <div className="component__layer">
          {layout.data?.flatMap(({ name }) => [
            name,
            ...getZoomedContainers(zoomedLayout.data, name).map(({ name }) => name)
          ]).map(container =>
            <Container key={container} name={container} />
          )}
        </div>
        <div className="component__layer topology__body-placeholder">
          <div className="topology__body" ref={ref}>
            {devices.data && connections.data?.map(
              ({ keypath, aEndDevice, zEndDevice, ...connection }) =>
                <Connection
                  key={`${aEndDevice} - ${zEndDevice}`}
                  keypath={keypath}
                  aEndDevice={aEndDevice}
                  zEndDevice={zEndDevice}
                  {...connection}
                />
            )}
            {devices.data?.map(({ name }) =>
                <Icon key={name} name={name}
                  getDeviceStatus={getDeviceStatus} />
            )}
            <DragLayerCanvas canvasRef={canvasRef} />
            <CustomDragLayer canvasRef={canvasRef} />
          </div>
        </div>
      </div>
      <LoadingOverlay items={{
        'Layouts':        fetchStatus(layout),
        'Zoomed Layouts': fetchStatus(zoomedLayout),
        'Devices':        fetchStatus(devices),
        'Zoomed Icons':   fetchStatus(zoomedIcons),
        'Connections':    fetchStatus(connections),
        'Platforms':      fetchStatus(platforms)
      }}/>
    </LayoutContextProvider>
  );
});

export default TopologyBody;
