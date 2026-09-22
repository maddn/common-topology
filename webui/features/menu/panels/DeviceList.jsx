import React from 'react';

import DroppableNodeQueryList from './DroppableNodeQueryList';


function DeviceList({ select, ...rest }) {
  console.debug('DeviceList Render');

  return (
    <DroppableNodeQueryList
      allowDrop={true}
      disableCreate={true}
      disableGoTo={true}
      isLeafList={true}
      baseSelect={select}
      { ...rest }
    />
  );
}

export default DeviceList;
