import React from 'react';
import {render} from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import App from './App'; // Our custom react component

import { combineReducers } from 'redux';
import * as reducers from './reducers';
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import thunk from 'redux-thunk';
import { applyMiddleware } from 'redux';

const appReducers = combineReducers(reducers);
const store = createStore(
  appReducers,
  applyMiddleware(thunk)
);

import 'bootstrap';
import './styles/theme.less';
import './styles/main.scss';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

// Render the main app react component into the app div.
// For more details see: https://facebook.github.io/react/docs/top-level-api.html#react.render
render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
);