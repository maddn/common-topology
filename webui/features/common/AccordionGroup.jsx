import React from 'react';
import { memo, useMemo, cloneElement, Children, useCallback, useEffect, useRef,
         useState } from 'react';

import Accordion from 'features/common/Accordion';


export function useSingleOpenState() {
  const [ openItem, setOpenItem ] = useState();

  const toggleItem = useCallback(item =>
    setOpenItem(openItem => openItem === item ? undefined : item), []);

  const clearOpenItem = useCallback(() => {
    setOpenItem(undefined);
  }, []);

  return { openItem, toggleItem, clearOpenItem };
}

export function useSingleOpenStateForGroup(resetKey) {
  const { openItem, toggleItem, clearOpenItem } = useSingleOpenState();
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

  const getSingleOpenState = useCallback(item => ({
    isOpen: openItem === item,
    fade: !!openItem,
    toggle: toggleForItem(item)
  }), [ openItem, toggleForItem ]);

  return getSingleOpenState;
}

const AccordionGroup = memo(function AccordionGroup({
  title, isOpen, fade, toggle, contextNote, children
}) {
  console.debug('AccordionGroup Render');

  const getSingleOpenState = useSingleOpenStateForGroup();
  const items = useMemo(() =>
    children && Children.map(children, child =>
      child && cloneElement(child, {
        ...getSingleOpenState(child.key)
      })
    ), [ children, getSingleOpenState ]);

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

export default AccordionGroup;
