import { createSlice, nanoid } from '@reduxjs/toolkit';


const initialState = {
  visible: false,
  thinkingEnabled: true,
  serverStatus: 'loading',
  streaming: false,
  items: []
};

const mcpSlice = createSlice({
  name: 'mcp',
  initialState,
  reducers: {
    itemAdded: {
      reducer(state, action) {
        state.items.push(action.payload);
      },
      prepare(item) {
        return {
          payload: {
            ...item,
            id: nanoid()
          }
        };
      }
    },
    lastItemTextAppended(state, action) {
      const item = state.items[state.items.length - 1];
      if (item) {
        item.text = `${item.text || ''}${action.payload || ''}`;
      }
    },
    streamingSet(state, action) {
      state.streaming = action.payload;
    },
    viewerCleared(state) {
      state.items = [];
      state.streaming = false;
    },
    viewerHidden(state) {
      state.visible = false;
    },
    viewerToggled(state) {
      state.visible = !state.visible;
    },
    viewerVisibleSet(state, action) {
      state.visible = action.payload;
    },
    thinkingEnabledSet(state, action) {
      state.thinkingEnabled = action.payload;
    },
    serverStatusSet(state, action) {
      state.serverStatus = action.payload;
    }
  }
});

export const {
  itemAdded,
  lastItemTextAppended,
  streamingSet,
  viewerCleared,
  viewerHidden,
  viewerToggled,
  viewerVisibleSet,
  thinkingEnabledSet,
  serverStatusSet
} = mcpSlice.actions;

export const getMcpItems = state => state.mcp.items;
export const getMcpVisible = state => state.mcp.visible;
export const getMcpStreaming = state => state.mcp.streaming;
export const getMcpThinkingEnabled = state => state.mcp.thinkingEnabled;
export const getMcpServerStatus = state => state.mcp.serverStatus;
export const getMcpHasViewer = state =>
  state.mcp.visible || state.mcp.items.length > 0;

export default mcpSlice.reducer;
