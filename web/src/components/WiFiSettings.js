import React, {Component} from 'react';
import SettingsGroup from './SettingsGroup';

const SETTINGS = {
  "network.setup_ap_password": {
    name: "Setup WiFi Network Password",
    type: 'password'
  },
  "network.hostname": {
    name: "Hostname"
  },
  "network.wifi_ssid": {
    name: "WiFi Network"
  },
  "network.wifi_password": {
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