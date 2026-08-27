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
      stroke="currentColor"
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M8 66 C29 94 45 102 60 102 C75 102 91 94 112 66" />
      <line x1="28" y1="88" x2="18" y2="104" />
      <line x1="60" y1="100" x2="60" y2="114" />
      <line x1="92" y1="88" x2="102" y2="104" />
    </g>
  </svg>
);
