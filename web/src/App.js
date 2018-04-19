/**
 * In this file, we create a React component
 * which incorporates components provided by Material-UI.
 */
import React from 'react';
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
  HashRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import Settings from './components/Settings';
import ErrorHandler from './components/ErrorHandler';

const BasicExample = () => (
  <Router>
    <div>
      <ErrorHandler />
      <Route exact path="/" component={Settings}/>
      <Route path="/settings" component={Settings}/>
    </div>
  </Router>
)
export default BasicExample