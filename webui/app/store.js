import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
         persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { jsonRpcApi } from 'api';
import { mcpApi } from 'api/mcp';
import mcpReducer from 'features/mcp/mcpSlice';
import topologyReducer from 'features/topology/topologySlice';
import menuReducer from 'features/menu/menuSlice';
import nsoReducer from 'features/nso/nsoSlice';

const topologyPersistConfig = {
  key: 'topology',
  storage: storage,
  whitelist: [
    'zoomedContainer',
    'expandedIcons',
    'visibleUnderlays',
    'iconSize',
    'rightSidebar'
  ]
};

const menuPersistConfig = {
  key: 'menu',
  storage: storage,
  whitelist: [ 'openTopology', 'openContext', 'openService' ]
};

export const rootReducer = combineReducers({
  nso: nsoReducer,
  mcp: mcpReducer,
  topology: persistReducer(topologyPersistConfig, topologyReducer),
  menu: persistReducer(menuPersistConfig, menuReducer),
  [jsonRpcApi.reducerPath]: jsonRpcApi.reducer,
  [mcpApi.reducerPath]: mcpApi.reducer
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['item-dragged',
        FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
    },
    immutableCheck: false
  }).concat(jsonRpcApi.middleware, mcpApi.middleware)
});
