import React, {Component} from 'react';
import {TextSetting} from './TextSetting';
import {updateSetting, saveSettings} from '../actions';
import {Button} from 'react-bootstrap';
import { connect } from 'react-redux'

const SettingsGroup = ({settings, fieldConfigs, onChange, onSubmit}) => (
  <form onSubmit={(e) => {e.preventDefault(); onSubmit(fieldConfigs)}}>
    {Object.entries(fieldConfigs).map((entry) => {
      const [key, config] = entry;
      const {name, type} = config;

      return (
        <TextSetting 
          settingKey={key}
          name={name}
          type={type}
          settings={settings}
          onChange={onChange}
        />
      )
    })}
    <Button type="submit">Save</Button>
  </form>
);

const mapStateToProps = state => ({
  settings: state.settings
});

const mapDispatchToProps = dispatch => ({
  onChange: (key, value) => dispatch(updateSetting(key, value)),
  onSubmit: (fieldConfigs) => dispatch(saveSettings(Object.keys(fieldConfigs)))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SettingsGroup)