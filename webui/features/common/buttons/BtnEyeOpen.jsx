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
      <path d="M7 60 C27 28 44 18 60 18 C76 18 93 28 113 60 C93 92 76 102 60 102 C44 102 27 92 7 60 Z" />
      <circle cx="60" cy="60" r="19" fill="currentColor" stroke="none" />
    </g>
  </svg>
);
