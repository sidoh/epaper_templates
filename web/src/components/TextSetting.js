import React, {Component} from 'react';
import {FormGroup, FormControl, ControlLabel} from 'react-bootstrap';

export const TextSetting = ({onChange, settingKey, type, name, settings}) => (
  <FormGroup controlId={settingKey}>
    <ControlLabel>{name}</ControlLabel>
    <FormControl 
      type={type}
      value={settings[settingKey]}
      onChange={(e) => { onChange(settingKey, e.target.value) }}
    />
  </FormGroup>
);

TextSetting.defaultProps = {
  type: 'text'
};