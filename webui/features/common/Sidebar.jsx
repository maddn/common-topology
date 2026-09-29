import './common.css';

import React from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useResizeDetector } from 'react-resize-detector';


function Sidebar({ children }) {
  console.debug('Sidebar Render');

  const ref = useRef();
  const innerRef = useRef();
  const resizeFrame = useRef();

  const resize = useCallback(() => {
    console.debug('Sidebar resize');
    if (!ref.current || !innerRef.current) {
      return;
    }

    const top = ref.current.clientHeight -
                innerRef.current.scrollHeight;

    ref.current.style.top = top > 0 ? '0px' : `${top}px`;
  }, []);

  const scheduleResize = useCallback(() => {
    if (resizeFrame.current) {
      window.cancelAnimationFrame(resizeFrame.current);
    }

    resizeFrame.current = window.requestAnimationFrame(() => {
      resizeFrame.current = undefined;
      resize();
    });
  }, [ resize ]);

  useResizeDetector({
    targetRef: innerRef,
    onResize: resize,
    handleWidth: false,
    handleHeight: true,
    refreshMode: 'debounce',
    refreshRate: 500,
    disableRerender: true
  });

  useEffect(() => {
    window.addEventListener('resize', scheduleResize);

    return () => {
      window.removeEventListener('resize', scheduleResize);
      if (resizeFrame.current) {
        window.cancelAnimationFrame(resizeFrame.current);
      }
    };
  }, [ scheduleResize ]);

  useLayoutEffect(() => {
    resize();
  });

  return (
    <div ref={ref} className="sidebar">
      <div
        ref={innerRef}
        className="sidebar__inner"
      >
        {children}
      </div>
    </div>
  );
}

export default Sidebar;
