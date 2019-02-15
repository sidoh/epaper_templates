/**
 * In this file, we create a React component
 * which incorporates components provided by Material-UI.
 */
import React from 'react';
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import Settings from './components/Settings';
import TemplateIndex from './components/templates/TemplateIndex';
import ShowTemplate from './components/templates/ShowTemplate';
import ErrorHandler from './components/ErrorHandler';

const BasicExample = () => (
  <Router basename="/app">
    <div>
      <ErrorHandler />
      <Route exact path="/" component={Settings}/>
      <Route path="/settings" component={Settings}/>
      <Route path="/templates" component={TemplateIndex} exact={true} />
      <Route to="template" path="/templates/:templateName/:action*" component={ShowTemplate}/>
    </div>
  </Router>
)
export default BasicExample