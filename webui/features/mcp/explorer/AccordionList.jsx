import React from 'react';
import { memo, useMemo, cloneElement, Children, useCallback, useEffect, useRef,
         useState } from 'react';

import Accordion from 'features/common/Accordion';


export function useOpenState() {
  const [ openItem, setOpenItem ] = useState();

  const toggleItem = useCallback(item =>
    setOpenItem(openItem => openItem === item ? undefined : item), []);

  const clearOpenItem = useCallback(() => {
    setOpenItem(undefined);
  }, []);

  return { openItem, toggleItem, clearOpenItem };
}

export function useOpenStateForItem(resetKey) {
  const { openItem, toggleItem, clearOpenItem } = useOpenState();
  const toggles = useRef({});
  const resetKeyRef = useRef(resetKey);

  useEffect(() => {
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      clearOpenItem();
    }
  }, [ clearOpenItem, resetKey ]);

  const toggleForItem = useCallback(item => {
    if (!toggles.current[item]) {
      toggles.current[item] = () => toggleItem(item);
    }
    return toggles.current[item];
  }, [ toggleItem ]);

  const openStateForItem = useCallback(item => ({
    isOpen: openItem === item,
    fade: !!openItem,
    toggle: toggleForItem(item)
  }), [ openItem, toggleForItem ]);

  return openStateForItem;
}

const AccordionList = memo(function AccordionList({
  title, isOpen, fade, toggle, contextNote, children
}) {
  console.debug('AccordionList Render');

  const openStateForItem = useOpenStateForItem();
  const items = useMemo(() =>
    children && Children.map(children, child =>
      child && cloneElement(child, {
        ...openStateForItem(child.key)
      })
    ), [ children, openStateForItem ]);

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
