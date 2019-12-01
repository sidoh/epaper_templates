import React, { useCallback, useMemo, useState, useEffect } from "react";
import Form from "react-jsonschema-form";
import {
  drillExtract,
  deepClearFields,
  deepClearNonMatching,
  deepPatch
} from "../util/mungers";
import createSchema from "./schema";
import { ArrayFieldTemplate } from "./ArrayFieldTemplate";

import "./SvgFieldEditor.scss";
import Nav from "react-bootstrap/Nav";
import BootstrapForm from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import { faSave, faCode } from "@fortawesome/free-solid-svg-icons";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";
import Button from "react-bootstrap/Button";

const VisualEditor = ({ schema, value, onChange }) => {
  const _onChange = useCallback(
    e => {
      onChange(e.formData);
    },
    [onChange]
  );

  return (
    <Form
      schema={schema}
      ArrayFieldTemplate={ArrayFieldTemplate}
      formData={value}
      onChange={_onChange}
      idPrefix="root"
      tagName="div"
    >
      <div className="d-none">
        <input type="submit" />
      </div>
    </Form>
  );
};

const RawEditor = ({ value, onChange, setEditMode }) => {
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    setEditValue(JSON.stringify(value, null, 2));
  }, [value]);

  const _onSave = useCallback(
    e => {
      try {
        onChange(JSON.parse(editValue));
        setError(null);
      } catch (e) {
        setError("Error parsing JSON: " + e.message);
      }
    },
    [onChange, editValue]
  );

  const formatValue = useCallback(() => {
    try {
      setEditValue(JSON.stringify(JSON.parse(editValue), null, 2));
    } catch (e) {
      setError("Error parsing JSON: " + e.message);
    }
  }, [editValue]);

  const onCancel = useCallback(() => {
    setEditValue(JSON.stringify(value, null, 2));
    setEditMode("visual");
  }, [value]);

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      <BootstrapForm.Control
        value={editValue}
        as="textarea"
        className="json-textarea"
        onChange={e => setEditValue(e.target.value)}
        rows={15}
      ></BootstrapForm.Control>

      <div className="button-list d-flex mt-2">
        <Button variant="success" size="sm" onClick={_onSave}>
          <MemoizedFontAwesomeIcon icon={faSave} className="fa-fw mr-1" />
          Save
        </Button>
        <Button variant="primary" size="sm" onClick={formatValue}>
          <MemoizedFontAwesomeIcon icon={faCode} className="fa-fw mr-1" />
          Format
        </Button>

        <div className="mr-auto" />

        <Button variant="outline-secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
};

const EditorModes = {
  json: RawEditor,
  visual: VisualEditor
};

export function SvgFieldEditor({
  value,
  onUpdateActive,
  screenMetadata,
  activeElements,
  allBitmaps
}) {
  const [editMode, setEditMode] = useState("visual");

  const onChange = useCallback(
    data => {
      onUpdateActive(obj => deepPatch(obj, data));
    },
    [activeElements, onUpdateActive]
  );

  const schema = useMemo(() => {
    let formatters = [];

    if (value && Array.isArray(value.formatters)) {
      formatters = value.formatters
        .map(x => {
          return x && typeof x === "object" && x.name;
        })
        .filter(x => x);
    }

    return createSchema({
      screenMetadata,
      selectedFields: activeElements,
      allBitmaps: Object.keys(allBitmaps),
      allFormatters: formatters
    });
  }, [value.formatters, screenMetadata, activeElements, allBitmaps]);

  const hasFields = Object.keys(schema.properties || {}).length > 0;

  const formValues = useMemo(() => {
    const selectedValues = activeElements.map(x => drillExtract(value, x));
    const fieldData = Object.fromEntries(
      Object.entries(deepClearNonMatching(selectedValues) || {}).filter(
        ([k]) => !k.startsWith("__")
      )
    );

    return fieldData;
  }, [schema, value]);

  return (
    <>
      {activeElements.length == 0 && <i>Nothing selected.</i>}
      {activeElements.length > 0 && !hasFields && (
        <i>Selected elements have no fields in common.</i>
      )}
      {activeElements.length > 0 && hasFields && (
        <>
          <Nav
            activeKey={editMode}
            onSelect={setEditMode}
            variant="pills"
            className="template-topnav"
          >
            <Nav.Item>
              <Nav.Link eventKey="visual">Visual</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="json">JSON</Nav.Link>
            </Nav.Item>
          </Nav>

          {Object.entries(EditorModes).map(([key, Editor]) => {
            const isHidden = key !== editMode;

            return (
              <div key={key} className={isHidden ? "d-none" : "d-block"}>
                <Editor
                  isHidden={isHidden}
                  value={formValues}
                  onChange={onChange}
                  schema={schema}
                  setEditMode={setEditMode}
                />
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
