import './topology.css';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';

import Topology from './Topology';
import ToggleButton from './ToggleButton';
import IconSizeSlider from './IconSizeSlider';
import MultiStateToggle from 'features/common/MultiStateToggle';

import { getDraggedItem,
         getEditMode, editModeToggled,
         getRightSidebar, rightSidebarChanged,
         getConnectionInfoVisible, connectionInfoToggled
} from './topologySlice';
import { useQuerySelection } from './QuerySelectionContext';


const defaultGetDeviceStatus = ({ platform }) =>
  platform ? 'reachable' : 'unreachable';

const RIGHT_SIDEBAR_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'mcp', label: 'MCP' },
  { value: 'config', label: 'Config' }
];

function TopologyViewer ({ getDeviceStatus = defaultGetDeviceStatus }) {
  console.debug('TopologyViewer Render');

  const draggedItem = useSelector((state) => getDraggedItem(state));
  const editMode = useSelector((state) => getEditMode(state));
  const rightSidebar = useSelector((state) => getRightSidebar(state));
  const connectionInfoVisible = useSelector((state) =>
    getConnectionInfoVisible(state));
  const { connections: connectionsQuery } = useQuerySelection();
  const hasConnectionInfo = connectionsQuery.selection.length > 0;

  const dispatch = useDispatch();

  return (
    <div className="topology__viewer">
      <Topology getDeviceStatus={getDeviceStatus}/>
      <div className="footer">
        <ToggleButton
          handleToggle={(value) => {dispatch(editModeToggled(value));}}
          checked={editMode}
          label="Edit Topology"
          />
        {hasConnectionInfo &&
          <ToggleButton
            handleToggle={(value) => {dispatch(connectionInfoToggled(value));}}
            checked={connectionInfoVisible}
            label="Show Link Info"
            />
        }
        <IconSizeSlider/>
        <MultiStateToggle
          label="Inspection Pane"
          value={rightSidebar}
          options={RIGHT_SIDEBAR_OPTIONS}
          onSelect={value => dispatch(rightSidebarChanged(value))}
        />
        <div className={classNames('component__layer', 'container__overlay', {
          'container__overlay--inactive': draggedItem
        })}/>
      </div>
    </div>
  );
}

export default TopologyViewer;
