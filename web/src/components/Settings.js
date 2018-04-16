import React from 'react';
import {Tabs, Tab} from 'react-bootstrap';
import WebSettings from './WebSettings';
import WiFiSettings from './WifiSettings';

export const Settings = ({settings}) => (
  <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
    <Tab eventKey={1} title="Web">
      <WebSettings />
    </Tab>
    <Tab eventKey={2} title="WiFi">
      <WiFiSettings />
    </Tab>
  </Tabs>
);