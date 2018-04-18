import React, {Component} from 'react';
import SettingsGroup from './SettingsGroup';

const SETTINGS = {
  "mqtt.server": {
    name: "MQTT Broker"
  },
  "mqtt.username": {
    name: "Username"
  },
  "mqtt.password": {
    name: "Password",
    type: 'password'
  },
  "mqtt.variables_topic_pattern": {
    name: "Variables Topic Pattern"
  }
};

const MQTTSettings = ({settings, onChange, onSubmit}) => (
  <SettingsGroup
    onSubmit={onSubmit}
    onChange={onChange}
    settings={settings}
    fieldConfigs={SETTINGS}
  />
);

export default MQTTSettings;