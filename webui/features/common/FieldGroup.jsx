import React from 'react';
import { memo, Fragment } from 'react';


const FieldGroup = memo(function FieldGroup({ title, ...rest }) {
  console.debug('FieldGroup Render');

  return (
    <Fragment>
      { title && <div className="header">
        <span className="header__title-text">{title}</span>
      </div>}
      <div className="field-group">
        {rest && Object.keys(rest).map(key =>
          <div key={key} className="field-group__row">
            <span className="field-group__label">{key}</span>
            <span className="field-group__value">
              <span className="field-group__value-rtl-inner">{rest[key]}</span>
            </span>
          </div>
        )}
      </div>
    </Fragment>
  );
});

export default FieldGroup;
