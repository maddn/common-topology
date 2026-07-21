import React from 'react';
import { PureComponent, createRef } from 'react';
import classNames from 'classnames';


class Accordion extends PureComponent {
  constructor(props) {
    super(props);
    this.ref = createRef();
    if (props.isOpen == undefined) {
      this.localState = true;
      this.state = {
        isOpen: false
      };
    } else {
      this.localState = false;
    }
  }

  componentDidMount() {
    const { variableHeight, startOpen } = this.props;
    if (startOpen) {
      this.toggle();
    }
    if (variableHeight && this.isOpen()) {
      this.animateToggle();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const wasOpen = this.localState ? prevState.isOpen : prevProps.isOpen;
    const { variableHeight } = this.props;
    if (variableHeight && this.isOpen() !== wasOpen) {
      this.animateToggle();
    }
  }

  toggle = () => {
    const { toggle } = this.props;
    if (typeof(toggle) === 'function') {
      toggle();
    } else {
      this.setState({ isOpen: !this.state.isOpen });
    }
  };

  isOpen = () => {
    if (this.localState) {
      return this.state.isOpen;
    }
    return this.props.isOpen;
  };

  render() {
    console.debug('Accordion Render');
    const { fade, level, variableHeight, right, title, isFetching,
      leadingActions, trailingActions, isContainerOnly, children
    } = this.props;

    const isOpen = this.isOpen();
    const hasHeader = title !== undefined || isFetching ||
      leadingActions || trailingActions;

    const accordion =
      <div className={classNames('accordion', {
        [ `accordion--level${level}` ]: level,
        'accordion--container-only': isContainerOnly,
        'accordion--right': right,
        'accordion--open': isOpen,
        'accordion--closed-fade': !isOpen && fade,
        'accordion--closed': !isOpen
      })}>
        {hasHeader &&
          <div className="accordion__header" onClick={this.toggle}>
            {leadingActions}
            <span
              className="accordion__header-height-anchor"
              aria-hidden="true"
            />
            {title !== undefined &&
              <span className="header__title-text">{title}</span>}
            {isFetching &&
              <div className="loading__dots">
                <span className="loading__dot"/>
                <span className="loading__dot"/>
                <span className="loading__dot"/>
              </div>}
            {trailingActions}
          </div>}
        <div
          ref={this.ref}
          className="accordion__panel"
          style={{ maxHeight: (!variableHeight && isOpen && this.ref.current)
            ? `${this.ref.current.scrollHeight}px` : undefined }}
        >
          {children}
        </div>
      </div>;
    return accordion;
  }

  onTransitionEnd = () => {
    this.ref.current.removeEventListener(
      'transitionend', this.onTransitionEnd);
    this.ref.current.style.maxHeight = 'none';
  };

  animateToggle = () => {
    if (this.isOpen()) {
      requestAnimationFrame(() => {
        this.ref.current.style.maxHeight =
          `${this.ref.current.scrollHeight}px`;
        this.ref.current.addEventListener(
          'transitionend', this.onTransitionEnd);
      });
    } else {
      this.ref.current.removeEventListener(
        'transitionend', this.onTransitionEnd);
      requestAnimationFrame(() => {
        this.ref.current.style.maxHeight =
          `${this.ref.current.scrollHeight}px`;
        requestAnimationFrame(() => {
          this.ref.current.style.maxHeight = 0;
        });
      });
    }
  };
}

export default Accordion;
