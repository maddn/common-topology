import './common.css';

import React, { memo } from 'react';
import classNames from 'classnames';

const MultiStateToggle = memo(function MultiStateToggle({
  label, value, options = [], onSelect
}) {
  console.debug('MultiStateToggle Render');

  return (
    <>
      {label &&
        <span className="footer__text multi-state-toggle__label">
          {label}
        </span>}
      <div className="multi-state-toggle">
        {options.map(option =>
          <button
            key={option.value}
            type="button"
            className={classNames('multi-state-toggle__option', {
              'multi-state-toggle__option--selected': option.value === value
            })}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>)}
      </div>
    </>
  );
});

export default MultiStateToggle;
