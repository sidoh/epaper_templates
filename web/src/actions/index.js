import ReduxThunk from 'redux-thunk';

export const updateSetting = (key, value) => ({
  type: 'UPDATE_SETTING',
  key,
  value
});

export const saveSettings = (keyFilter) => {
  return (dispatch, getState) => {
    dispatch(savingSettings());

    const settings = getState().settings;
    const settingsCopy = {};

    keyFilter.map(key => settingsCopy[key] = settings[key]);

    fetch(
      '/settings',
      {
        method: 'PUT',
        credentials: 'same-origin',
        body: JSON.stringify(settingsCopy),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    .then(e => settingsSaved())
    .catch(e => saveSettingsError(e));
  };
}

export const loadSettings = () => {
  return (dispatch, getState) => {
    dispatch(loadingSettings());
    fetch(
      '/settings',
      {
        credentials: 'same-origin'
      }
    )
    .then(response => settingsLoaded(JSON.parse(response.text())))
    .catch(e => loadSettingsError(e));
  };
}

export const savingSettings = () => ({
  type: 'SAVING_SETTINGS'
});

export const settingsSaved = () => ({
  type: 'SETTINGS_SAVED'
})

export const saveSettingsError = (message) => ({
  type: 'SAVE_SETTINGS_ERROR',
  message: message
});

export const loadingSettings = () => ({
  type: 'LOADING_SETTINGS'
});

export const settingsLoaded = (settings) => ({
  type: 'SETTINGS_LOADED',
  settings: settings
})

export const loadSettingsError = (message) => ({
  type: 'LOAD_SETTINGS_ERROR',
  message: message
});