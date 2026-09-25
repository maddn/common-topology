import React, { createContext, useContext } from 'react';

const defaultSelection = {
  devices: {
    selection: [],
    subscribe: undefined
  },
  connections: {
    selection: []
  }
};

export const QuerySelectionContext = createContext(defaultSelection);

// Projects can extend the common topology device and connection queries with
// leaves used for project-specific status, tooltips, or link metrics.
export function QuerySelectionProvider({
    devices = {}, connections = {}, children }) {
  const value = {
    devices: {
      ...defaultSelection.devices,
      ...devices,
      selection: devices.selection || []
    },
    connections: {
      ...defaultSelection.connections,
      ...connections,
      selection: connections.selection || []
    }
  };

  return (
    <QuerySelectionContext.Provider value={value}>
      {children}
    </QuerySelectionContext.Provider>
  );
}

export const useQuerySelection = () => useContext(QuerySelectionContext);
