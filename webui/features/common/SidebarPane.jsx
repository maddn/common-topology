import React from 'react';
import { Component } from 'react';
import classNames from 'classnames';


class SidebarPane extends Component {
  render() {
    console.debug('SidebarPane Render');
    const { children, footer, hidden } = this.props;

    return (
      <div className={classNames('sidebar__pane', {
        'sidebar__pane--hidden': hidden
      })}>
        <div className="sidebar__body">
          {children}
        </div>
        {footer &&
          <div className="sidebar__footer">
            {footer}
          </div>}
      </div>
    );
  }
}

export default SidebarPane;
