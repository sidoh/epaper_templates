import { handleFetchErrors } from './helpers'

var errorId = 0;

export const updateTemplate = (template) => ({
  type: 'UPDATE_SELECTED_TEMPLATE',
  value: template
});

export const saveTemplate = (templateName, templateContents) => {
  return (dispatch, getState) => {
    dispatch(savingTemplate(templateName));

    var formData = new FormData();

    var data = new Blob([`${templateContents}\r\n`], {type: 'application/json'});
    formData.append('template', data, `${templateName}.json`);

    return fetch(
      '/templates',
      {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      }
    )
    .then(handleFetchErrors)
    .then(e => dispatch(templateSaved(templateName)))
    .catch(e => {
      dispatch(saveTemplateError(templateName, e.message));
      throw e;
    });
  };
}

export const loadTemplates = () => {
  return (dispatch, getState) => {
    dispatch(loadingTemplates());
    fetch(
      '/templates',
      {
        credentials: 'same-origin'
      }
    )
    .then(handleFetchErrors)
    .then(response => response.json())
    .then(body => {
      dispatch(templatesLoaded(
        body.map(e => ({
          filename: e.name.replace(/^\/t\//, ''),
          name: e.name.replace(/^\/t\//, '').replace(/\.json$/, '')
        }))
      ))
    })
    .catch(e => {
      dispatch(loadTemplatesError(e.message))
      throw e
    });
  };
}

export const savingTemplate = (templateName) => ({
  type: 'SAVING_TEMPLATE',
  name: templateName
});

export const templateSaved = (templateName) => ({
  type: 'TEMPLATE_SAVED',
  name: templateName
})

export const saveTemplateError = (templateName, message) => ({
  type: 'SAVE_TEMPLATE_ERROR',
  name: templateName,
  message: `Error saving template -- ${message}`,
  errorId: errorId++
});

export const loadingTemplates = () => ({
  type: 'LOADING_TEMPLATES'
});

export const templatesLoaded = (templates) => ({
  type: 'TEMPLATES_LOADED',
  templates: templates
})

export const loadTemplatesError = (message) => ({
  type: 'LOAD_TEMPLATES_ERROR',
  message: `Error loading template list -- ${message}`,
  errorId: errorId++
});

export const loadTemplate = (templateName) => {
  return (dispatch, getState) => {
    dispatch(loadingTemplate(templateName));
    fetch(
      `/templates/${templateName}`,
      {
        credentials: 'same-origin'
      }
    )
    .then(handleFetchErrors)
    .then(response => response.json())
    .then(body => {
      dispatch(templateLoaded(templateName, body))
    })
    .catch(e => {
      console.log(e);
      dispatch(loadTemplateError(templateName, e.message))
    });
  };
}

export const loadingTemplate = (templateName) => ({
  type: 'LOADING_TEMPLATE',
  name: templateName
});

export const templateLoaded = (templateName, contents) => ({
  type: 'TEMPLATE_LOADED',
  name: templateName,
  contents: contents
})

export const loadTemplateError = (templateName, message) => ({
  type: 'LOAD_TEMPLATE_ERROR',
  name: templateName,
  message: `Error loading template -- ${message}`,
  errorId: errorId++
});

export const deleteTemplate = (templateName) => {
  return (dispatch, getState) => {
    dispatch(deletingTemplate(templateName));

    fetch(
      `/templates/${templateName}`,
      {
        method: 'DELETE',
        credentials: 'same-origin'
      }
    )
    .then(handleFetchErrors)
    .then(e => dispatch(deletedTemplate(templateName)))
    .catch(e => {
      dispatch(deleteTemplateError(templateName, e.message));
      throw e;
    });
  }
}

export const deletingTemplate = (templateName) => ({
  type: 'DELETING_TEMPLATE',
  name: templateName
});

export const deletedTemplate = (templateName) => ({
  type: 'DELETED_TEMPLATE',
  name: templateName
});


export const deleteTemplateError = (templateName, message) => ({
  type: 'DELETE_TEMPLATE_ERROR',
  name: templateName,
  message: `Error deleting template -- ${message}`,
  errorId: errorId++
});
