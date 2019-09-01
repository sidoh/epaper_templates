import React, {Component} from 'react';
import SettingsGroup from './SettingsGroup';

const SETTINGS = {
  "display.template_name": {
    name: "Template Name",
  },
  "display.display_type": {
    name: "Display Type",
    type: 'dropdown'
  }
};

const DisplaySettings = ({settings, onChange, onSubmit}) => (
  <SettingsGroup
    onSubmit={onSubmit}
    onChange={onChange}
    settings={settings}
    fieldConfigs={SETTINGS}
  />
);

export default DisplaySettings;