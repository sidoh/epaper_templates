import React from 'react';
import {Tabs, Tab} from 'react-bootstrap';
import WebSettings from './WebSettings';
import WiFiSettings from './WifiSettings';
import MQTTSettings from './MQTTSettings';
import HardwareSettings from './HardwareSettings';
import Loadable from 'react-loading-overlay';

export const Settings = ({settings, isLoading}) => (
  <Loadable active={isLoading} spinner text='Loading settings'>
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
    </Tabs>
  </Loadable>
);