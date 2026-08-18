import React, { Fragment, memo } from 'react';


const schemaType = schema => {
  if (schema?.enum?.length) {
    return 'enum';
  }
  if (schema?.type === 'array') {
    return `array<${schema.items?.type || 'value'}>`;
  }
  if (schema?.type) {
    return schema.type;
  }
  if (schema?.properties) {
    return 'object';
  }
  if (schema?.items) {
    return 'array';
  }
  return 'value';
};

export const schemaInputs = (
  properties = {}, required = [], prefix = '', level = 0, maxLevel = 2
) => Object.entries(properties).flatMap(([key, value]) => {
  const name = prefix ? `${prefix}.${key}` : key;
  const row = {
    name,
    description: value.description,
    required: required.includes(key),
    inputType: schemaType(value),
    level
  };

  if (level >= maxLevel) {
    return [ row ];
  }

  if (value.properties) {
    return [
      row,
      ...schemaInputs(
        value.properties, value.required || [], name, level + 1, maxLevel)
    ];
  }

  if (value.type === 'array' && value.items?.properties) {
    return [
      row,
      ...schemaInputs(
        value.items.properties, value.items.required || [],
        `${name}[]`, level + 1, maxLevel)
    ];
  }

  return [ row ];
});

export const promptInputs = (promptArguments = [], defaultArguments = {}) =>
  promptArguments.map(({ name, description, required }) => ({
    name, description, required,
    inputType: 'string',
    defaultValue: defaultArguments[name]
  }));


const InputList = memo(function InputList({ inputs }) {
  console.debug('InputList Render');

  if (!inputs.length) {
    return (
      <div className="content-group__row">
        <span className="content-group__row-value">No inputs.</span>
      </div>
    );
  }

  return (
    <Fragment>
      <div className="content-group__row">
        <span className="content-group__row-label">Inputs</span>
      </div>
      {inputs.map(({ name, description, inputType, required, defaultValue,
          level = 0 }, index) => {
        const leafName = name.split('.').pop();
        const uniqueDescription = (
          description?.toLowerCase() === leafName.toLowerCase()) ?
          undefined : description
        return (
          <div
            key={index}
            className="content-group__row"
            style={{ paddingLeft: `${level}rem` }}
          >
            <span className="content-group__row-label">
              {name.toLowerCase()}{required && ' *'}
            </span>
            {defaultValue && <span className="content-group__row-value">
              [{defaultValue}]
            </span>}
            <span className="content-group__row-value">
              {inputType}
            </span>
            {uniqueDescription &&
              <div className="content-group__row-value">
                {uniqueDescription}
              </div>}
          </div>
        );
      })}
    </Fragment>
  );
});

export default InputList;
