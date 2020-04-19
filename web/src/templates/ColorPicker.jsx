import React from "react";

import "./ColorPicker.scss";

export const ColorPicker = ({ value, onChange, colors }) => {
  return (
    <div className="d-flex color-picker">
      {colors.map((color) => (
        <div
          key={color}
          className={`color-choice ${value == color ? "active" : ""}`}
          onClick={x => onChange(color)}
          style={{ backgroundColor: color }}
        ></div>
      ))}
    </div>
  );
};

export const withColorPicker = ({ colors }) => {
  return ({ ...props }) => <ColorPicker colors={colors} {...props} />;
};
