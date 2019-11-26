import React, { useState, useEffect, useCallback, useRef } from "react";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPencilAlt,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { useBoolean } from "react-use";
import Form from "react-jsonschema-form";
import { FormatterSchema, MarkedForDeletion } from "./schema";
import { BadgedText } from "./BadgedText";
import produce from "immer";

const uiSchema = {
  formatter: {
    type: {
      "ui:enumDisabled": ["ref"]
    }
  }
};

function FormatterForm({ initialState = {}, onSave }) {
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
      schema={FormatterSchema}
      formData={formState}
      onChange={onChange}
      onSubmit={onSubmit}
    >
      <div className="button-list">
        <Button variant="success" onClick={onSubmit}>
          submit
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
      <BadgedText badge={def && def.type}>{formatter.name}</BadgedText>

      <div className="mr-auto" />

      <div className="button-list">
        <a href="#" className="text-primary" onClick={_onEdit}>
          <FontAwesomeIcon icon={faPencilAlt} />
        </a>

        <a href="#" className="text-danger" onClick={_onDelete}>
          <FontAwesomeIcon icon={faTrash} />
        </a>
      </div>
    </div>
  );
}

function FormatterList({ formatters, onEdit, onDelete }) {
  return (
    <ul className="block-list">
      {formatters.map((x, i) => (
        <>
          {x !== MarkedForDeletion && (
            <li key={x.name}>
              <FormatterListItem
                formatter={x}
                index={i}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </li>
          )}
        </>
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
        />
      )}
      {editing === null && (
        <>
          <div className="d-flex button-list mb-2">
            <Button size="sm" onClick={onNew}>
              <FontAwesomeIcon icon={faPlus} className="fa-fw mr-2" />
              New
            </Button>
          </div>

          <FormatterList
            formatters={value.formatters}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </>
      )}
    </>
  );
}
