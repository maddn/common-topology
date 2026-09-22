import React, { Fragment, memo, useCallback, useState } from 'react';

import LoadingOverlay from './LoadingOverlay';

import { isFetching } from 'api/query';

const SidebarSection = memo(function SidebarSection({
  title, headerActions, fetching, children
}) {
  console.debug('SidebarSection Render');

  const [ minHeight, setMinHeight ] = useState(0);

  const measuredRef = useCallback(node => {
    if (node !== null) {
      const height = isFetching(fetching) ? node.scrollHeight : 0;
      setTimeout(() => setMinHeight(height), height < minHeight ? 1000 : 0);
    }
  }, [ minHeight, fetching ]);

  return (
    <Fragment>
      {title &&
        <div className="header">
          <span className="header__title-text">{title}</span>
          {headerActions}
        </div>}
      <div
        className="accordion__group"
        style={{minHeight: `${minHeight}px`,
        transition: `min-height ${minHeight === 0 ? 1000 : 0}ms`
      }}
      >
        {fetching && <LoadingOverlay items={fetching} ref={measuredRef}/>}
        {children}
      </div>
    </Fragment>
  );
});

export default SidebarSection;
