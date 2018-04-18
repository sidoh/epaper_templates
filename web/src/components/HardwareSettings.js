import React, {Component} from 'react';
import SettingsGroup from './SettingsGroup';

const SETTINGS = {
  "display.dc_pin": {
    name: "DC Pin",
    type: 'number'
  },

  "display.rst_pin": {
    name: "RST Pin",
    type: 'number'
  },

  "display.busy_pin": {
    name: "Busy Pin",
    type: 'number'
  }
};

const HardwareSettings = ({settings, onChange, onSubmit}) => (
  <SettingsGroup
    onSubmit={onSubmit}
    onChange={onChange}
    settings={settings}
    fieldConfigs={SETTINGS}
  />
);

export default HardwareSettings;