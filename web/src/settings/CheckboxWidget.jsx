import React, { useCallback } from "react";
import Switch from "react-switch";

export function CheckboxWidget({ value, onChange, label }) {
  let checked = value;

  if (typeof checked === "string") {
    checked = checked.toLowerCase() === "true";
  }

  const _onChange = useCallback(value => onChange(value), [onChange]);

  return (
    <label className="react-switch">
      <span>{label}</span>
      <Switch onChange={_onChange} checked={checked} />
    </label>
  )
}