import React, { useState, useEffect, useCallback, useRef } from "react";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPencilAlt,
  faTrash,
  faSave
} from "@fortawesome/free-solid-svg-icons";
import { useBoolean } from "react-use";
import Form from "react-jsonschema-form";
import { FormatterSchema, MarkedForDeletion } from "./schema";
import { BadgedText } from "./BadgedText";
import produce from "immer";
import { ArrayFieldTemplate } from "./ArrayFieldTemplate";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";
import Alert from "react-bootstrap/Alert";

const uiSchema = {
  formatter: {
    type: {
      "ui:enumDisabled": ["ref"]
    }
  },
  "ui:ArrayFieldTemplate": ArrayFieldTemplate
};

function FormatterForm({ initialState = {}, onSave, onCancel }) {
  const [formState, setFormState] = useState(initialState);

  const onChange = useCallback(e => {
    setFormState(e.formData);
  }, []);

  const onSubmit = useCallback(
    e => {
      onSave(formState);
    },
    [onSave, formState]
  );

  return (
    <Form
      tagName="div"
      uiSchema={uiSchema}
      ArrayFieldTemplate={ArrayFieldTemplate}
      schema={FormatterSchema}
      formData={formState}
      onChange={onChange}
      onSubmit={onSubmit}
    >
      <div className="button-list d-flex">
        <Button variant="success" onClick={onSubmit} size="sm">
          <MemoizedFontAwesomeIcon icon={faSave} className="fa-fw mr-2" />
          Save
        </Button>

        <Button
          variant="outline-secondary"
          onClick={onCancel}
          size="sm"
          className="ml-auto"
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
}

function FormatterListItem({ formatter, index, onEdit, onDelete }) {
  const _onEdit = useCallback(
    e => {
      e.preventDefault();
      onEdit(index);
    },
    [index, onEdit]
  );

  const _onDelete = useCallback(
    e => {
      e.preventDefault();

      if (confirm("Are you sure you want to delete this formatter?")) {
        onDelete(index);
      }
    },
    [index, onDelete]
  );

  const { formatter: def } = formatter;

  return (
    <div className="d-flex">
      <a
        href="#"
        className="d-block mr-auto w-100 text-white"
        onClick={_onEdit}
      >
        <BadgedText badge={def && def.type}>{formatter.name}</BadgedText>
      </a>

      <div className="button-list">
        <a href="#" className="text-danger" onClick={_onDelete}>
          <MemoizedFontAwesomeIcon icon={faTrash} />
        </a>
      </div>
    </div>
  );
}

function FormatterList({ formatters, onEdit, onDelete }) {
  if (!Array.isArray(formatters)) {
    return (
      <Alert variant="danger">
        <p>
          <b>The formatter section has unexpected type.</b>
        </p>
        <p>
          Should be an Array, but is:{" "}
          <code className="bg-white p-1 rounded">{typeof formatters}</code>
        </p>
      </Alert>
    );
  }

  return (
    <ul className="block-list">
      {formatters.map((x, i) => (
        <React.Fragment key={i}>
          {x !== MarkedForDeletion && (
            <li>
              <FormatterListItem
                formatter={x}
                index={i}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </li>
          )}
        </React.Fragment>
      ))}
    </ul>
  );
}

export function FormatterEditor({ value, onUpdate }) {
  const [editing, setEditing] = useState(null);

  const onNew = useCallback(() => {
    setEditing("new");
  }, []);

  const onEdit = useCallback(
    index => {
      setEditing(index);
    },
    [value]
  );

  const onSave = useCallback(
    data => {
      const updated = produce(value, draft => {
        if (editing === "new") {
          draft.formatters.push(data);
        } else {
          Object.assign(draft.formatters[editing], data);
        }
      });
      onUpdate(updated);
      setEditing(null);
    },
    [value, onUpdate, editing]
  );

  const onDelete = useCallback(index => {
    const updated = produce(value, draft => {
      draft.formatters.splice(index, 1, MarkedForDeletion);
    });
    onUpdate(updated);
  });

  return (
    <>
      {editing !== null && (
        <FormatterForm
          initialState={value.formatters[editing]}
          onSave={onSave}
          onCancel={() => setEditing(null)}
        />
      )}
      {editing === null && (
        <>
          <FormatterList
            formatters={value.formatters || []}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          <div className="d-flex button-list mt-2">
            <div className="ml-auto" />

            <Button size="sm" variant="outline-success" onClick={onNew}>
              <MemoizedFontAwesomeIcon icon={faPlus} className="fa-fw mr-2" />
              New Formatter
            </Button>
          </div>
        </>
      )}
    </>
  );
}
