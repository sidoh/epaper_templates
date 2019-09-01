import React from 'react';
import {render} from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import App from './App';

import * as reducers from './reducers';

import { Provider } from 'react-redux'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import thunk from 'redux-thunk';
import { Provider as AlertProvider } from 'react-alert'
import AlertTemplate from './components/AlertTemplate'

const appReducers = combineReducers(reducers);
const store = createStore(
  appReducers,
  applyMiddleware(thunk)
);

import 'bootstrap';
import './styles/theme.less';
import './styles/main.less';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

const ALERT_OPTIONS = {
  position: 'bottom center',
  timeout: 50000,
  offset: '30px',
  transition: 'scale',
}

// Render the main app react component into the app div.
// For more details see: https://facebook.github.io/react/docs/top-level-api.html#react.render
render(
  <Provider store={store}>
    <AlertProvider template={AlertTemplate} {...ALERT_OPTIONS}>
      <App />
    </AlertProvider>
  </Provider>,
  document.getElementById('app')
);