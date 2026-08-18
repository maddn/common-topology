import React, { memo, useState } from 'react';
import classNames from 'classnames';
import hljs from 'highlight.js';


const highlightedText = ({ text, format }) => {
  const value = String(text || '');
  const trimmed = value.trim();
  if (format === 'json') {
    return hljs.highlight(value, { language: 'json' }).value;
  }
  if (!trimmed || !/^[{[]/.test(trimmed)) {
    return undefined;
  }

  try {
    JSON.parse(trimmed);
  } catch (err) {
    return undefined;
  }

  return hljs.highlight(value, { language: 'json' }).value;
};

export const Text = memo(function Text({ children, format }) {
  console.debug('Text Render');

  const html = highlightedText({ text: children, format });
  if (html) {
    return (
      <pre
        className="mcp-viewer__text"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <pre className="mcp-viewer__text">
      {children}
    </pre>
  );
});

const compactText = value =>
  String(value ?? '').replace(/\s+/g, ' ').trim();


const Item = memo(function Item({
  title, header, text, collapsed, error, active, children
}) {
  console.debug('Item Render');

  const [ open, setOpen ] = useState(!collapsed);

  const bodyText = error ?? text;
  const inlineText = String(bodyText ?? '').replace(/\r?\n$/, '');
  const multilineText = /[\r\n]/.test(inlineText);

  // If no header is provided, and the body text is a single line, display that
  // inline as the header text.
  const headerText = header || (!multilineText && inlineText);
  const visibleHeaderText = headerText || (!open && compactText(bodyText));

  const showBody = open && (children || multilineText ||
    (header && bodyText !== undefined && bodyText !== null));

  return (
    <div className={classNames(
      'mcp-viewer__activity',
      {
        'mcp-viewer__error': Boolean(error)
      }
    )}>
      <button
        type="button"
        className={classNames(
          'mcp-viewer__activity-header',
          { 'mcp-viewer__activity-header--collapsed': !open }
        )}
        onClick={() => setOpen(current => !current)}
      >
        <span className="mcp-viewer__activity-title">
          {title}:
        </span>
        {visibleHeaderText &&
          <span className={classNames(
            'mcp-viewer__text',
            { 'mcp-viewer__text--tail': !open }
          )}>
            {visibleHeaderText}
          </span>}
        {active && <span className="mcp-viewer__activity-cursor"/>}
      </button>
      {showBody && (children ?
        children
        : <Text>{bodyText}</Text>)}
    </div>
  );
});

export default Item;
