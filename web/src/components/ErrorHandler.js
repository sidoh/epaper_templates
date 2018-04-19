import React from 'react';
import { connect } from 'react-redux';
import { withAlert } from 'react-alert'

class ErrorHandler extends React.Component {
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.hasError && this.props.errorId != prevProps.errorId) {
      this.props.alert.error(this.props.errorMessage.toString());
    }
  }

  render() {
    return (
      <span></span>
    );
  }
}

export default connect(
  (state) => ({
    errorMessage: state.loadingStatus.errorMessage,
    hasError: state.loadingStatus.hasError,
    errorId: state.loadingStatus.errorId
  }),
  (dispatch) => () => {}
)(withAlert(ErrorHandler));