import { createSelector, createSlice } from '@reduxjs/toolkit';

// === Selectors ==============================================================

export const getOpenTopology = state => state.menu.openTopology;
export const getOpenContext = state => state.menu.openContext;
export const getOpenService = state => state.menu.openService;
const getConfigReferences = state => state.menu.configReferences;

export const getOpenTopologyName = state =>
  getOpenTopology(state) && getOpenTopology(state).match(/{([^}]+)}$/)[1];

export const getOpenContextName = state =>
  getOpenContext(state) && getOpenContext(state).match(/{([^}]+)}$/)[1];

export const getOpenServiceReferences = createSelector(
  [ getOpenService, getConfigReferences ],
  (openService, configReferences = []) => openService
    ? [ openService, ...configReferences ].filter(Boolean)
    : []
);


// === Reducer ================================================================

const menuSlice = createSlice({
  name: 'menu',
  initialState: {},
  reducers: {
    // openTopology is the canvas topology. Do not reuse it as a generic sidebar
    // context; tme-demo keeps this fixed while its sidebar context is tenant.
    topologyToggled: (state, { payload }) => {
      state.openTopology = state.openTopology === payload ? undefined : payload;
    },

    toggleContext: (state, { payload }) => {
      state.openContext = state.openContext === payload ? undefined : payload;
    },

    // openService is pane selection and the default ConfigViewer backpointer
    // reference. Some parent panes publish additional config references.
    setOpenService: (state, { payload }) => {
      if (state.openService !== payload) {
        state.configReferences = undefined;
      }
      state.openService = payload;
    },

    setConfigReferences: (state, { payload }) => {
      state.configReferences = payload;
    },
  }
});

const { actions, reducer } = menuSlice;
export const {
  topologyToggled, toggleContext, setOpenService, setConfigReferences
} = actions;
export default reducer;
