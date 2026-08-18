import React, { Fragment, memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { removeKeys } from 'api/query';
import { getOpenService } from 'features/menu/menuSlice';

import AccordionList from '../AccordionList';
import ToolItem, { useTools } from './Item';


const READ_TOOLS = [
  { title: 'Read Config', name: 'nso_read_config' },
  { title: 'Read Operational', name: 'nso_read_operational' },
  { title: 'Read Schema', name: 'nso_read_schema' }
];
const READ_TOOL_NAMES = READ_TOOLS.map(({ name }) => name);


const ReadTools = memo(function ReadTools({
  isOpen, fade, toggle, onOutput
}) {
  console.debug('ReadTools Render');

  const path = useSelector(getOpenService);
  const tools = useTools(READ_TOOL_NAMES);
  const contextNote = useMemo(() => path
    ? <Fragment>
        Current path: <strong>{path}</strong>. This path will be used as the
        path input for these tools.
      </Fragment>
    : <Fragment>
        Select a service in the sidebar. The selected service will be used as
        the path input for these tools.
      </Fragment>,
    [ path ]);
  const items = useMemo(() =>
    READ_TOOLS.map(item => {
      const tool = tools.find(tool => tool.name === item.name);
      const readPath = item.name === 'nso_read_schema' ?
        path && removeKeys(path) : path;
      return tool &&
        <ToolItem
          key={item.name}
          tool={tool}
          toolArguments={{ path: readPath }}
          onOutput={onOutput}
          disabled={!readPath}
          title={item.title}
        >
          {readPath &&
            <div className="content-group__row">
              <span className="content-group__row-label">path:</span>
              <span className="content-group__row-value">{readPath}</span>
            </div>}
        </ToolItem>
    }).filter(Boolean), [ onOutput, path, tools ]);

  return tools.length > 0 ? (
    <AccordionList
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      title="Read"
      contextNote={contextNote}
    >
      {items}
    </AccordionList>
  ) : null;
});

export default ReadTools;
