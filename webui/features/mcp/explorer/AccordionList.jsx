import React from 'react';
import { memo, useState, useCallback, useRef, useMemo,
         cloneElement, Children } from 'react';

import Accordion from 'features/common/Accordion';


const AccordionList = memo(function AccordionList({
  title, isOpen, fade, toggle, contextNote, children
}) {
  console.debug('AccordionList Render');

  const [ openItem, setOpenItem ] = useState(undefined);
  const toggleItem = useCallback(item =>
    setOpenItem(openItem => openItem === item ? undefined : item), []);
  const itemToggles = useRef({});
  const toggleForItem = useCallback(item => {
    if (!itemToggles.current[item]) {
      itemToggles.current[item] = () => toggleItem(item);
    }
    return itemToggles.current[item];
  }, [ toggleItem ]);
  const items = useMemo(() =>
    children && Children.map(children, child =>
      child && cloneElement(child, {
        isOpen: openItem === child.key,
        fade: !!openItem,
        toggle: toggleForItem(child.key),
      })
    ), [ children, openItem, toggleForItem ]);

  return (
    <Accordion
      level={1}
      isOpen={isOpen}
      fade={fade}
      toggle={toggle}
      variableHeight={true}
      title={title}
    >
      {contextNote &&
        <div className="content-group">
          <div className="content-group__row">
            <span className="content-group__row-value">{contextNote}</span>
          </div>
        </div>}
      {items}
    </Accordion>
  );
});

export default AccordionList;
