import React from 'react';
import { connect } from 'react-redux';
import {Tabs, Tab} from 'react-bootstrap';
import Loadable from 'react-loading-overlay';

import { loadSettings } from '../actions';

import WebSettings from './WebSettings';
import WiFiSettings from './WiFiSettings';
import MQTTSettings from './MQTTSettings';
import HardwareSettings from './HardwareSettings';
import DisplaySettings from './DisplaySettings';

class Settings extends React.Component {
  componentDidMount() {
    this.props.onLoad();
  }

  render() {
    return (
      // <Loadable active={this.props.isLoading} spinner text='Loading settings'>
        <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
          <Tab eventKey={1} title="Web">
            <WebSettings />
          </Tab>
          <Tab eventKey={2} title="WiFi">
            <WiFiSettings />
          </Tab>
          <Tab eventKey={3} title="MQTT">
            <MQTTSettings />
          </Tab>
          <Tab eventKey={4} title="Hardware">
            <HardwareSettings />
          </Tab>
          <Tab eventKey={5} title="Display">
            <DisplaySettings />
          </Tab>
        </Tabs>
      // </Loadable>
    )
  }
};

export default connect(
  (state) => ({
    isLoading: (state.loadingStatus || {}).isLoading
  }),
  (dispatch) => ({
    onLoad: () => { dispatch(loadSettings()); }
  })
)(Settings);