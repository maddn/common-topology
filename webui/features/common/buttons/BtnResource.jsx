import React from 'react';

export default React.forwardRef(({size}, ref) =>
  <svg
    ref={ref}
    className="round-btn__svg-icon"
    style={{height: `${size}px`, width: `${size}px`}}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 120 120"
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="18"
    >
      <path d="M16 8 h56 l32 32 v72 H16 Z" />
      <path d="M72 8 v34 h32" />
    </g>
  </svg>
);
