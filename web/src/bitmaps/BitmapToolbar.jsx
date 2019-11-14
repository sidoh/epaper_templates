import React, { useCallback, useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {
  faSave,
  faPencilAlt,
  faFillDrip,
  faFolderOpen,
  faExpandArrowsAlt,
  faCheck,
  faTrash,
  faDownload,
  faUndo,
  faRedo
} from "@fortawesome/free-solid-svg-icons";

import "./BitmapToolbar.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useToggle } from "react-use";
import api from "../util/api";

const DimensionEditor = ({ label, value, onChange }) => {
  const _onChange = useCallback(e => onChange(e.target.value));

  return (
    <div className="dimension-editor">
      <label>{label}</label>
      <input type="number" value={value} onChange={_onChange} />
    </div>
  );
};

const ToolSwitcher = ({ name, icon, onChange, isActive }) => {
  const onClick = useCallback(() => onChange(name), [name, onChange]);

  return (
    <li>
      <Button className={isActive ? "active" : ""} onClick={onClick}>
        <FontAwesomeIcon icon={icon} />
      </Button>
    </li>
  );
};

const TOOLS = [
  { name: "pencil", icon: faPencilAlt },
  { name: "fill", icon: faFillDrip }
  // { name: "import", icon: faFileImage }
];

const COLORS = [
  { name: "white", canvasColor: "rgb(255,255,255)", bitValue: 0 },
  { name: "black", canvasColor: "rgb(0,0,0)", bitValue: 1 }
];

export default ({
  width,
  height,
  bitmapDefinition,
  onResize,
  activeTool,
  onChangeTool,
  onSave,
  isLoaderActive,
  toggleLoaderActive,
  onDownload,
  color,
  setColor,
  onDelete,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [isResizing, toggleResizing] = useToggle(false);
  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);

  useEffect(() => setResizeWidth(width), [width]);
  useEffect(() => setResizeHeight(height), [height]);

  const onSaveResize = useCallback(() => {
    onResize({ width: parseInt(resizeWidth), height: parseInt(resizeHeight) });
    toggleResizing();
  }, [resizeWidth, resizeHeight, onResize]);

  return (
    <div className="bitmap-toolbar d-flex">
      <label>Actions</label>
      <ul className="tool-list">
        <li>
          <Button title="Save" onClick={onSave}>
            <FontAwesomeIcon icon={faSave} />
          </Button>
        </li>
        <li>
          <Button
            title="Open"
            className={isLoaderActive ? "active" : ""}
            onClick={toggleLoaderActive}
          >
            <FontAwesomeIcon icon={faFolderOpen} />
          </Button>
        </li>
        <li>
          <Button
            title="Resize"
            className={isResizing ? "active" : ""}
            onClick={toggleResizing}
          >
            <FontAwesomeIcon icon={faExpandArrowsAlt} />
          </Button>
        </li>
        <li>
          <Button disabled={!canUndo} title="Undo" onClick={onUndo}>
            <FontAwesomeIcon icon={faUndo} />
          </Button>
        </li>
        <li>
          <Button disabled={!canRedo} title="Redo" onClick={onRedo}>
            <FontAwesomeIcon icon={faRedo} />
          </Button>
        </li>
      </ul>

      <div className="spacer" />

      <label>File</label>
      <ul className="tool-list">
        <li>
          <Button onClick={onDownload} title="Download">
            <FontAwesomeIcon icon={faDownload} />
          </Button>
        </li>
        <li>
          <Button title="Delete" variant="danger" onClick={onDelete}>
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </li>
      </ul>

      <div className="spacer" />

      <label>Tool</label>
      <ul className="tool-list">
        {TOOLS.map(x => (
          <ToolSwitcher
            key={x.name}
            isActive={x.name == activeTool}
            name={x.name}
            icon={x.icon}
            onChange={onChangeTool}
          />
        ))}
      </ul>

      <div className="spacer" />

      <label>Color</label>
      <ul className="tool-list">
        {COLORS.map(x => (
          <li key={x.name}>
            <Button
              className={`color-picker ${x.name}${
                x.bitValue === color ? " active" : ""
              }`}
              onClick={e => setColor(x.bitValue)}
            />
          </li>
        ))}
      </ul>

      <div className="flex-grow-1"></div>

      {isResizing && (
        <>
          <DimensionEditor
            label="Width"
            value={resizeWidth}
            onChange={setResizeWidth}
          />
          <DimensionEditor
            label="Height"
            value={resizeHeight}
            onChange={setResizeHeight}
          />
          <ul className="tool-list">
            <li>
              <Button variant="success" onClick={onSaveResize}>
                <FontAwesomeIcon icon={faCheck} />
              </Button>
            </li>
          </ul>
        </>
      )}
    </div>
  );
};
