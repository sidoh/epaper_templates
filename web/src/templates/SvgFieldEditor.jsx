import React, { useCallback, useMemo, useState, useEffect } from "react";
import Form from "react-jsonschema-form";
import {
  drillExtract,
  deepClearFields,
  deepClearNonMatching,
  deepPatch
} from "../util/mungers";
import createSchema, { FieldTypeDefinitions } from "./schema";
import { ArrayFieldTemplate } from "./ArrayFieldTemplate";

import "./SvgFieldEditor.scss";
import Nav from "react-bootstrap/Nav";
import BootstrapForm from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import { faSave, faCode, faCheck } from "@fortawesome/free-solid-svg-icons";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";
import Button from "react-bootstrap/Button";
import useGlobalState from "../state/global_state";
import { VariableAutocompleteField } from "./VariableAutocompleteField";

const VisualEditor = ({ schema, value, onChange }) => {
  const [globalState, globalActions] = useGlobalState();

  const _onChange = useCallback(
    e => {
      onChange(e.formData);
    },
    [onChange]
  );

  const uiSchema = useMemo(() => {
    const variableDef = {
      variable: {
        "ui:field": "typeahead",
        typeahead: {
          allowNew: true,
          newSelectionPrefix: "New variable: ",
          minLength: 0,
          options: Object.keys(globalState.variables || {})
        }
      }
    };

    return {
      value: {...variableDef},
      w: {...variableDef},
      h: { ...variableDef}
    };
  }, [globalState.variables]);

  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      ArrayFieldTemplate={ArrayFieldTemplate}
      formData={value}
      onChange={_onChange}
      fields={{ typeahead: VariableAutocompleteField }}
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
    const fieldData = Object.fromEntries(
      Object.entries(value).filter(([k]) => !k.startsWith("__"))
    );
    setEditValue(JSON.stringify(fieldData, null, 2));
  }, [value]);

  const _onSave = useCallback(
    e => {
      try {
        onChange(JSON.parse(editValue));
        setError(null);
        setEditMode("visual");
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
          <MemoizedFontAwesomeIcon icon={faCheck} className="fa-fw mr-1" />
          Apply
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
      allFormatters: formatters,
      rotation: value.rotation || 0
    });
  }, [value.formatters, screenMetadata, activeElements, allBitmaps]);

  const hasFields = Object.keys(schema.properties || {}).length > 0;

  const formValues = useMemo(() => {
    const selectedValues = deepClearNonMatching(
      activeElements.map(x => drillExtract(value, x)) || {}
    );

    return selectedValues || {};
  }, [schema, value]);

  const creatingType = formValues["__creating"];

  return (
    <>
      {creatingType ? (
        <Alert variant="secondary" className="new-element">
          <h5>Creating new {FieldTypeDefinitions[creatingType].title}</h5>
          <p>
            <i>Select position on canvas to continue.</i>
          </p>
        </Alert>
      ) : (
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
      )}
    </>
  );
}
