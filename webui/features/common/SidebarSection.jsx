import React, { Fragment, memo } from 'react';
import LoadingOverlay from './LoadingOverlay';


const SidebarSection = memo(function SidebarSection({
  title, headerActions, fetching, children
}) {
  console.debug('SidebarSection Render');

  return (
    <Fragment>
      {title &&
        <div className="header">
          <span className="header__title-text">{title}</span>
          {headerActions}
        </div>}
      <div className="accordion__group">
        {fetching && <LoadingOverlay items={fetching}/>}
        {children}
      </div>
    </Fragment>
  );
});

export default SidebarSection;
