export const settings = (state = {}, action) => {
  var newState;

  if (action.type == 'UPDATE_SETTING') {
    newState = Object.assign({}, state, {[action.key]: action.value});
  } else if (action.type == 'SETTINGS_LOADED') {
    newState = Object.assign({}, state, action.settings);
  } else {
    newState = state;
  }

  return newState;
}

export const loadingStatus = (pages = {}, action) => {
  var newState;

  if (action.type == 'LOADING_SETTINGS') {
    newState = Object.assign({}, pages, {isLoading: true});
  } else if (action.type == 'SETTINGS_LOADED') {
    newState = Object.assign({}, pages, {isLoading: false, hasError: false});
  } else if (action.type == 'LOAD_SETTINGS_ERROR') {
    newState = Object.assign({}, pages, {
      isLoading: false, 
      errorMessage: `Error loading settings: ${action.message}`, 
      hasError: true
    });
  } else {
    newState = pages;
  }

  return newState;
}