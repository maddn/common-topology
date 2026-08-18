import React from 'react';

export default React.forwardRef(({size}, ref) =>
  <svg
    ref={ref}
    className="round-btn__svg-icon"
    style={{height: `${size}px`, width: `${size}px`}}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 120 120"
  >
    <path
      d="M19 10 h82 a9 9 0 0 1 9 9 v58 a9 9 0 0 1 -9 9 H60 L31 111 V86 H19 a9 9 0 0 1 -9 -9 V19 a9 9 0 0 1 9 -9 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="18"
    />
    <g fill="currentColor">
      <circle cx="38" cy="51" r="8.5" />
      <circle cx="60" cy="51" r="8.5" />
      <circle cx="82" cy="51" r="8.5" />
    </g>
  </svg>
);
