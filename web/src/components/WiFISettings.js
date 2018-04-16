import React, {Component} from 'react';
import SettingsGroup from './SettingsGroup';

const SETTINGS = {
  "wifi.setup_ap_password": {
    name: "Setup WiFi Network Password",
    type: 'password'
  },
  "wifi.hostname": {
    name: "Hostname"
  },
  "wifi.ssid": {
    name: "WiFi Network"
  },
  "wifi.password": {
    name: "WiFi Password",
    type: 'password'
  }
};

const WiFiSettings = ({settings, onChange, onSubmit}) => (
  <SettingsGroup
    onSubmit={onSubmit}
    onChange={onChange}
    settings={settings}
    fieldConfigs={SETTINGS}
  />
);

export default WiFiSettings;