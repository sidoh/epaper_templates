import React, {Component} from 'react';
import SettingsGroup from './SettingsGroup';

const SETTINGS = {
  "web.admin_username": {
    name: "Admin Username"
  },
  "web.admin_password": {
    name: "Admin Password",
    type: 'password'
  },
  "web.port": {
    name: "Web Server Port",
    type: 'number'
  },
  "web.mdns_name": {
    name: "mDNS Name"
  }
}

const WebSettings = ({settings, onChange, onSubmit}) => (
  <SettingsGroup
    onSubmit={onSubmit}
    onChange={onChange}
    settings={settings}
    fieldConfigs={SETTINGS}
  />
);

export default WebSettings;