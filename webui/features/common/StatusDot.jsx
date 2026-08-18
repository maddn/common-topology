import React, { memo } from 'react';
import classNames from 'classnames';
import Tippy from '@tippyjs/react';


const StatusDot = memo(function StatusDot({
  state, tooltip, className
}) {
  console.debug('StatusDot Render');

  return (
    <Tippy
      placement="bottom"
      content={tooltip}
    >
      <span
        className={classNames('status-dot', {
          [`status-dot--${state}`]: state
        }, className)}
      >
        <span className="status-dot__dot"/>
      </span>
    </Tippy>
  );
});

export default StatusDot;
