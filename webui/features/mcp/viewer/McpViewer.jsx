import '../../terminal/terminal.css';
import '../mcp.css';

import React, {
  Fragment, memo, useCallback, useEffect, useRef, useState
} from 'react';
import classNames from 'classnames';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { getSystemSetting, jsonRpcApi } from 'api';
import { assistantStream } from 'api/assistant';
import { stopThenGoToUrl } from 'api/comet';
import { removePrefixes } from 'api/query';
import * as IconTypes from 'constants/Icons';
import { configurationEditorUrl } from 'features/nso/WebuiOne';

import InlineBtn from 'features/common/buttons/InlineBtn';

import { getMcpServiceName, useMcpDevice } from '../selection';
import {
  getMcpItems, getMcpStreaming, getMcpThinkingEnabled, getMcpVisible,
  itemAdded, lastItemTextAppended, streamingSet, thinkingEnabledSet,
  viewerCleared, viewerHidden
} from '../mcpSlice';


import Prompt from './Prompt';
import Resource from './Resource';
import Tool from './Tool';
import Item from './Item';


const isActiveModelThinking = item =>
  item?.type === 'model-thinking';
const ASSISTANT_SETTINGS_PATH = '/topologies/assistant';

const McpItem = memo(function McpItem({ request, response, active }) {
  console.debug('McpItem Render');

  const item = request || response || {};
  const method = item.method;

  if (method === 'resources/read') {
    return (
      <Resource
        request={request}
        response={response}
        active={active}
      />
    );
  }

  if (method === 'prompts/get') {
    return (
      <Prompt
        request={request}
        response={response}
        active={active}
      />
    );
  }

  return (
    <Tool
      request={request}
      response={response}
      active={active}
    />
  );
});

const TimelineEntry = memo(function TimelineEntry({ item, active }) {
  console.debug('TimelineEntry Render');

  if (item.type === 'mcp-request') {
    return (
      <McpItem
        request={item}
        active={active}
      />
    );
  }

  if (item.type === 'mcp-response') {
    return (
      <McpItem
        response={item}
        active={active}
      />
    );
  }

  return (
    <Item
      title={{
        user: 'You',
        assistant: 'Assistant',
        'model-thinking': 'Model Thinking'
      }[item.type] || 'MCP'}
      header={item.meta}
      collapsed={item.collapsed}
      error={item.error}
      text={item.text}
      active={active}
    />
  );
});

const Timeline = memo(function Timeline({ items, streaming }) {
  console.debug('Timeline Render');

  const activeIndex = streaming ? items.length - 1 : -1;
  const showWaiting = streaming && !isActiveModelThinking(items[activeIndex]);
  const activeItemIndex = showWaiting
    ? -1
    : activeIndex;
  const timeline = [
    ...items.map((item, index) => ({
      item,
      active: index === activeItemIndex,
      key: item.id || `item:${index}`
    })),
    ...(showWaiting
      ? [
        {
          item: {
            type: 'assistant',
            text: 'Thinking...'
          },
          active: true,
          key: 'waiting'
        }
      ]
      : [])
  ];
  const renderedItems = [];
  for (let index = 0; index < timeline.length; index++) {
    const { item, active, key } = timeline[index];
    const next = timeline[index + 1];
    const nextItem = next?.item;
    if (item.type === 'mcp-request' && nextItem?.type === 'mcp-response') {
      renderedItems.push(
        <McpItem
          key={`${key}:${next.key}`}
          request={item}
          response={nextItem}
          active={active || next.active}
        />
      );
      index++;
      continue;
    }
    renderedItems.push(
      <TimelineEntry
        key={key}
        item={item}
        active={active}
      />
    );
  }

  return renderedItems;
});

const SuggestedMessages = memo(function SuggestedMessages({
  groups = [], onSelect
}) {
  console.debug('SuggestedMessages Render');

  const selectMessage = useCallback(event => {
    onSelect(event.currentTarget.value);
  }, [ onSelect ]);
  if (!groups.length) {
    return null;
  }

  return groups.map(({ note, messages }) =>
    <Fragment key={note || messages.join('|')}>
      {note &&
        <div className="mcp-viewer__activity">
          <span className="mcp-viewer__text">{note}</span>
        </div>}
      {messages.map(message =>
        <button
          key={message}
          type="button"
          className="mcp-viewer__activity mcp-viewer__suggested-message"
          value={message}
          onClick={selectMessage}
        >
          <span className="mcp-viewer__text">{message}</span>
        </button>)}
    </Fragment>
  );
});


const McpViewer = memo(function McpViewer({
  suggestedMessageGroups = [],
  serviceSchemas = []
}) {
  console.debug('MCP Viewer Render');

  const dispatch = useDispatch();
  const items = useSelector(getMcpItems);
  const streaming = useSelector(getMcpStreaming);
  const visible = useSelector(getMcpVisible);
  const thinkingEnabled = useSelector(getMcpThinkingEnabled);
  const user = useSelector(
    state => getSystemSetting.select('user')(state).data?.result
  );
  const selectedDevice = useMcpDevice();
  const selectedService = useSelector(state => {
    for (const schema of serviceSchemas) {
      if (!schema.attachToChat) {
        continue;
      }

      const serviceName = getMcpServiceName(state, schema);
      if (serviceName) {
        return {
          label: schema.label,
          name: serviceName,
          uri: `nso:/${removePrefixes(schema.path)}${serviceName}`
        };
      }
    }
  }, shallowEqual);
  const [ input, setInput ] = useState('');
  const [ sending, setSending ] = useState(false);
  const transcriptRef = useRef();
  const inputRef = useRef();
  const stickToBottom = useRef(true);

  const updateStickToBottom = () => {
    const transcript = transcriptRef.current;
    if (!transcript) {
      return;
    }

    const distanceFromBottom = transcript.scrollHeight -
      transcript.scrollTop - transcript.clientHeight;
    stickToBottom.current = distanceFromBottom < 24;
  };

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript && stickToBottom.current) {
      transcript.scrollTop = transcript.scrollHeight;
    }
  }, [ items, sending, streaming, visible ]);

  const appendStreamUpdate = update => {
    if (update.keepalive || update.type === 'status') {
      return;
    }

    if (update.type === 'model-thinking-delta') {
      dispatch(lastItemTextAppended(String(update.text ?? '')));
      return;
    }

    if (update.type) {
      dispatch(itemAdded(update));
    }
  };

  const send = async () => {
    const entered = input;
    const message = input.trim();
    if (!message || sending) {
      return;
    }

    setInput('');
    setSending(true);
    dispatch(itemAdded({
      type: 'user',
      text: entered
    }));
    dispatch(streamingSet(true));
    try {
      const response = await assistantStream({
        message,
        context: {
          user,
          selectedDevice,
          ...(selectedService ? { selectedService } : {})
        },
        think: thinkingEnabled,
        onEvent: appendStreamUpdate
      });

      if (response.invalidateData) {
        dispatch(jsonRpcApi.util.invalidateTags([ 'data' ]));
      }
    } catch (err) {
      appendStreamUpdate({
        type: 'assistant',
        error: err.message
      });
    } finally {
      dispatch(streamingSet(false));
      setSending(false);
    }
  };

  const selectSuggestedMessage = useCallback(message => {
    setInput(message);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const clearViewer = () => {
    setInput('');
    dispatch(viewerCleared());
    dispatch(viewerHidden());
  };

  const clearSession = () => {
    setInput('');
    dispatch(viewerCleared());
  };

  const goToAssistantSettings = () => {
    dispatch(stopThenGoToUrl(configurationEditorUrl(ASSISTANT_SETTINGS_PATH)));
  };

  return (
    <div className={classNames(
      'terminal__viewer',
      'component__layer', {
      'terminal__viewer--hidden': !visible
    })}>
      <div className="component__layer terminal__viewer-background"/>
      <div className="component__layer terminal__viewer-body">
        <div className="header">
          <InlineBtn
            icon={IconTypes.BTN_DELETE}
            style="danger"
            tooltip="Clear and Close MCP Session"
            onClick={clearViewer}
          />
          <span className="header__title-text">MCP Session</span>
          <InlineBtn
            icon={IconTypes.BTN_GOTO}
            tooltip="View Assistant Settings in Configuration Editor"
            onClick={goToAssistantSettings}
          />
          <InlineBtn
            icon={thinkingEnabled
              ? IconTypes.BTN_THINKING
              : IconTypes.BTN_THINKING_OFF}
            tooltip={thinkingEnabled
              ? 'Disable Thinking'
              : 'Enable Thinking'}
            onClick={() => dispatch(thinkingEnabledSet(!thinkingEnabled))}
          />
          <InlineBtn
            icon={IconTypes.BTN_RESET}
            tooltip="Clear MCP Session"
            onClick={clearSession}
          />
          <InlineBtn
            icon={IconTypes.BTN_HIDE_CONSOLE_VIEWER}
            tooltip="Hide MCP Session"
            onClick={() => dispatch(viewerHidden())}
          />
        </div>
        <div
          ref={transcriptRef}
          className="terminal"
          onScroll={updateStickToBottom}
        >
          {!items.length &&
            <>
              <div className="mcp-viewer__activity">
                <span className="mcp-viewer__text">
                  Run a tool or resource from MCP Explorer to show the result
                  here.
                  You can also ask the assistant by clicking one of the
                  recommended messages below or typing your own.
                </span>
              </div>
              <SuggestedMessages
                groups={suggestedMessageGroups}
                onSelect={selectSuggestedMessage}
              />
            </>}
          <Timeline items={items} streaming={streaming} />
          {!sending &&
            <form
              className="mcp-viewer__activity"
              onSubmit={event => {
                event.preventDefault();
                send();
              }}
            >
              <div className="mcp-viewer__activity-header">
                <span className="mcp-viewer__activity-title">You:</span>
                <input
                  ref={inputRef}
                  className="mcp-viewer__text mcp-viewer__input"
                  value={input}
                  placeholder="type a request and press Enter"
                  onChange={event => setInput(event.target.value)}
                  autoComplete="off"
                />
              </div>
            </form>}
        </div>
      </div>
    </div>
  );
});

export default McpViewer;
