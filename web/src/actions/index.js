import ReduxThunk from 'redux-thunk';

const handleFetchErrors = (response) => {
  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
  return response;
}

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
    .then(handleFetchErrors)
    .then(e => dispatch(settingsSaved()))
    .catch(e => {
      console.log(e);
      dispatch(saveSettingsError(e.message))
    });
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
    .then(handleFetchErrors)
    .then(response => response.json())
    .then(body => {
      dispatch(settingsLoaded(body))
    })
    .catch(e => {
      console.log(e);
      dispatch(loadSettingsError(e.message))
    });
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

var errorId = 0;

export const loadSettingsError = (message) => ({
  type: 'LOAD_SETTINGS_ERROR',
  message: message,
  errorId: errorId++
});