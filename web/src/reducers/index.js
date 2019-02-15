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
  var newState = pages;

  switch (action.type) {
    case 'LOADING_SETTINGS':
    case 'LOADING_TEMPLATES':
    case 'LOADING_TEMPLATE':
    case 'SAVING_TEMPLATE':
    case 'DELETING_TEMPLATE':

      newState = Object.assign({}, pages, {isLoading: true});
      break;

    case 'SETTINGS_LOADED':
    case 'TEMPLATES_LOADED':
    case 'TEMPLATE_LOADED':
    case 'TEMPLATE_SAVED':
    case 'TEMPLATE_DELETED':

      newState = Object.assign({}, pages, {isLoading: false, hasError: false});
      break;

    case 'SAVE_SETTINGS_ERROR':
    case 'LOAD_SETTINGS_ERROR':
    case 'LOAD_TEMPLATES_ERROR':
    case 'LOAD_TEMPLATE_ERROR':
    case 'SAVE_TEMPLATE_ERROR':
    case 'DELETE_TEMPLATE_ERROR':

      newState = Object.assign({}, pages, {
        isLoading: false,
        errorMessage: action.message,
        hasError: true,
        errorId: action.errorId
      });
      break;
  }

  return newState;
}

export const templates = (state = {}, action) => {
  var newState = state;

  if (action.type == 'UPDATE_SELECTED_TEMPLATE') {
    newState = Object.assign({}, state, {selectedTemplate: action.value});
  } else if (action.type == 'TEMPLATES_LOADED') {
    newState = Object.assign({}, state, {templates: action.templates});
  } else if (action.type == 'TEMPLATE_LOADED') {
    const templateContents = {
      templateContents: Object.assign({}, state.templateContents, {[action.name]: action.contents})
    };
    newState = Object.assign({}, state, 
      templateContents,
      {selectedTemplate: action.name}
    );
  } else if (action.type == 'DELETED_TEMPLATE') {
    var newTemplates = state.templates.filter(v => (v.filename != action.name));
    newState = Object.assign({}, state, {templates: newTemplates});

    var newTemplateContents = Object.assign({}, state.templateContents);
    delete newTemplateContents[action.name];
    newState.templateContents = newTemplateContents;
  }

  return newState;
}