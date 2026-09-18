import { getOpenTopology, setOpenTopology,
         topologyToggled } from 'features/menu/menuSlice';
import { getVisibleUnderlays, setVisibleUnderlays, underlayToggled,
         iconSizeChanged } from 'features/topology/topologySlice';

const DEFAULT_DATA_STORAGE_KEY = 'default_data_storage';
const PREFERENCES_KEY = 'topology-ui:preferences';

const readDefaultDataStorage = () => {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(DEFAULT_DATA_STORAGE_KEY) || '{}'
    );

    return value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
};

const writeDefaultDataStorage = value => {
  window.localStorage.setItem(DEFAULT_DATA_STORAGE_KEY, JSON.stringify(value));
};

const readPreferences = (storage = readDefaultDataStorage()) => {
  const preferences = storage[PREFERENCES_KEY];

  return preferences && typeof preferences === 'object' &&
    !Array.isArray(preferences)
    ? preferences
    : {};
};

const writePreference = (key, value) => {
  const storage = readDefaultDataStorage();
  const storedPreferences = {
    ...readPreferences(storage)
  };

  if (value === undefined) {
    delete storedPreferences[key];
  } else {
    storedPreferences[key] = value;
  }

  writeDefaultDataStorage({
    ...storage,
    [PREFERENCES_KEY]: storedPreferences
  });
};

export const restorePreferences = dispatch => {
  const preferences = readPreferences();

  if (preferences.iconSize !== undefined) {
    dispatch(iconSizeChanged(preferences.iconSize));
  }

  if (Array.isArray(preferences.visibleUnderlays)) {
    dispatch(setVisibleUnderlays(preferences.visibleUnderlays));
  }

  if (preferences.openTopology !== undefined) {
    dispatch(setOpenTopology(preferences.openTopology));
  }
};

export const startPreferenceListeners = listenerMiddleware => {
  listenerMiddleware.startListening({
    actionCreator: iconSizeChanged,
    effect: ({ payload }) => {
      writePreference('iconSize', payload);
    }
  });

  listenerMiddleware.startListening({
    actionCreator: underlayToggled,
    effect: (_action, { getState }) => {
      writePreference(
        'visibleUnderlays',
        getVisibleUnderlays(getState())
      );
    }
  });

  listenerMiddleware.startListening({
    actionCreator: topologyToggled,
    effect: (_action, { getState }) => {
      writePreference('openTopology', getOpenTopology(getState()));
    }
  });
};
