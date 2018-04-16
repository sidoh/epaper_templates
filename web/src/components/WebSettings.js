import React, {Component} from 'react';
import {TextSetting} from './TextSetting';
import {updateSetting, saveSettings} from '../actions';
import {Button} from 'react-bootstrap';
import { connect } from 'react-redux'
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