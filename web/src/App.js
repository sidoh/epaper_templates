/**
 * In this file, we create a React component
 * which incorporates components provided by Material-UI.
 */
import React from 'react';
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withAlert } from 'react-alert'

import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import { Settings } from './components/Settings';
import { loadSettings } from './actions';

class SettingsPage extends React.Component {
  componentDidMount() {
    this.props.onLoad();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.hasError && !prevProps.hasError) {
      this.props.alert.error(this.props.errorMessage.toString());
    }
  }

  render() {
    return (
      <div>
        <h1>Settings</h1>
        <Settings isLoading={this.props.isLoading} />
      </div>
    );
  }
}

SettingsPage.defaultProps = {
  isLoading: true,
  onLoad: () => {},
  errorMessage: null,
  hasError: false
};

SettingsPage.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  onLoad: PropTypes.func,
  errorMessage: PropTypes.string,
  hasError: PropTypes.bool
};

export default connect(
  state => ({
    isLoading: state.loadingStatus.isLoading,
    errorMessage: state.loadingStatus.errorMessage,
    hasError: state.loadingStatus.hasError
  }),
  dispatch => ({
    onLoad: () => {dispatch(loadSettings())}
  })
)(withAlert(SettingsPage));