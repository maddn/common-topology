import React, { Fragment, memo } from 'react';


function formatDescription(
    description = '', { showTag = true, showPath = true, service = false } = {}) {
  let text = description.trim();
  const lines = [];
  let tagText;
  let pathText;

  const action = text.match(/^NSO Action:\s*([\s\S]*)$/);
  if (action) {
    tagText = '[NSO Action]';
    text = action[1];
  }

  const tag = text.match(/^(\[[^\]]+\])\s*(.*)$/);
  if (tag) {
    tagText = tag[1];
    text = tag[2];
  }

  const path = text.match(/\s*(\(path:\s*[^)]+\))/);
  if (path) {
    pathText = path[1];
    text = text.replace(path[0], ' ');
  }

  if (tagText === '[NSO Service]' || service) {
    text = text.split('Available parameters:')[0];
    text = text.replace(/\s*Service:\s*[^.]+\.?\s*$/, '');
  }

  if (tagText && showTag) {
    lines.push({ type: 'tag', text: tagText });
  }

  if (pathText && showPath) {
    lines.push({
      type: 'path',
      text: pathText.replace(/^\(path:\s*/, '').replace(/\)$/, '')
    });
  }

  text = text.trim().replace(/\s+\./g, '.');
  if (text) {
    lines.push({ type: 'text', text });
  }

  return lines;
}


const Description = memo(function Description({
  description, showTag, service
}) {
  console.debug('Description Render');

  return (
    <Fragment>
      {formatDescription(description, { showTag, service }).map((line, index) =>
        <div
          key={index}
          className="content-group__row"
        >
          {line.type === 'tag'
            ? <span className="content-group__row-label">{line.text}</span>
            : line.type === 'path'
            ? <>
                <span className="content-group__row-label">Path:</span>
                <span className="content-group__row-value">{line.text}</span>
              </>
            : <span className="content-group__row-value">{line.text}</span>}
        </div>)}
    </Fragment>
  );
});

export default Description;
