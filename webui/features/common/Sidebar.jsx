import './common.css';

import React from 'react';
import { Component, createRef } from 'react';
import ReactResizeDetector from 'react-resize-detector';


class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.ref = createRef();
    this.innerRef = createRef();
    this.resizeFrame = null;
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize);
    this.resize();
  }

  componentDidUpdate() {
    this.resize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
    if (this.resizeFrame) {
      window.cancelAnimationFrame(this.resizeFrame);
    }
  }

  handleWindowResize = () => {
    this.scheduleResize();
  };

  scheduleResize = () => {
    if (this.resizeFrame) {
      window.cancelAnimationFrame(this.resizeFrame);
    }

    this.resizeFrame = window.requestAnimationFrame(() => {
      this.resizeFrame = null;
      this.resize();
    });
  };

  resize = () => {
    console.debug('Sidebar resize');
    if (!this.ref.current || !this.innerRef.current) {
      return;
    }

    const top = this.ref.current.clientHeight -
                this.innerRef.current.scrollHeight;

    this.ref.current.style.top = top > 0 ? '0px' : `${top}px`;
  };

  render() {
    console.debug('Sidebar Render');
    const { children } = this.props;

    return (
      <div ref={this.ref} className="sidebar">
        <div
          ref={this.innerRef}
          className="sidebar__inner"
        >
          <ReactResizeDetector handleHeight
            onResize={this.resize}
            refreshMode="debounce"
            refreshRate={500}
          />
          {children}
        </div>
      </div>
    );
  }
}

export default Sidebar;
