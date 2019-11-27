import React, { useMemo, useCallback, useState } from "react";
import { groupBy, drillExtract } from "../util/mungers";
import { FieldTypeDefinitions, Schema } from "./schema";

import "./SelectionEditor.scss";
import Button from "react-bootstrap/Button";
import { faWindowClose } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import produce from "immer";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useBoolean } from "react-use";
import Form from "react-bootstrap/Form";
import { BadgedText } from "./BadgedText";

const valueTitleGenerator = (el = {}) => {
  const { value } = el;

  if (value) {
    if (value.type === "static") {
      return <BadgedText badge="static">{value.value}</BadgedText>;
    } else if (value.type === "variable") {
      return (
        <BadgedText badge="variable">
          <code>{value.variable}</code>
        </BadgedText>
      );
    }
  }

  return <i>Unrecognized format</i>;
};

const fieldTitleGenerator = fields => {
  return (el = {}) => {
    return (
      <span>
        {Object.entries(el)
          .filter(([k]) => fields.some(f => f === k))
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => (
            <BadgedText className="mr-2" key={k} badge={k}>
              {v}
            </BadgedText>
          ))}
      </span>
    );
  };
};

const defaultTitleGenerator = el => {
  return JSON.stringify(el);
};

const SectionListItemTitleGenerators = {
  text: valueTitleGenerator,
  bitmaps: valueTitleGenerator,
  lines: fieldTitleGenerator(["x1", "x2", "y1", "y2"]),
  rectangles: defaultTitleGenerator
};

function SectionListItem({ id, type, value, onDelete, onDeselect }) {
  const titleGenerator = SectionListItemTitleGenerators[type];
  const _onDelete = useCallback(
    e => {
      e.preventDefault();

      if (confirm("Are you sure you want to delete this element?")) {
        onDelete([id]);
      }
    },
    [onDelete, id]
  );

  const _onDeselect = useCallback(
    e => {
      e.preventDefault();
      onDeselect(id);
    },
    [onDeselect, id]
  );

  return (
    <div className="d-flex button-list">
      <span className="mr-auto">{titleGenerator(value)}</span>

      <a
        href="#"
        className="text-primary"
        onClick={_onDeselect}
        title="Deselect"
      >
        <FontAwesomeIcon icon={faWindowClose} />
      </a>

      <a className="text-danger" href="#" onClick={_onDelete} title="Delete">
        <FontAwesomeIcon icon={faTrash} />
      </a>
    </div>
  );
}

function SectionList({ title, items, onDelete, onDeselect }) {
  return (
    <div className="selection-section">
      <h5>
        {title} ({items.length})
      </h5>
      <ul className="block-list">
        {items.map(x => (
          <li key={x.id}>
            <SectionListItem
              {...x}
              onDelete={onDelete}
              onDeselect={onDeselect}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddElementForm({ onAdd }) {
  const [selection, setSelection] = useState("");

  const handleChange = useCallback(e => {
    setSelection(e.target.value);
  }, []);

  const _onAdd = useCallback(() => {
    onAdd(selection);
  }, [onAdd, selection]);

  return (
    <div className="mt-2 d-flex align-items-end">
      <Form.Group className="flex-grow-1 mb-0">
        <Form.Label>Type</Form.Label>
        <Form.Control
          as="select"
          value={selection}
          onChange={handleChange}
          placeholder="type"
        >
          <>
            <option value=""></option>
            {Object.entries(FieldTypeDefinitions).map(([k, v]) => (
              <option key={k} value={k}>
                {v.title}
              </option>
            ))}
          </>
        </Form.Control>
      </Form.Group>

      <Button
        variant="success"
        className="ml-2"
        disabled={selection === ""}
        onClick={_onAdd}
      >
        Add
      </Button>
    </div>
  );
}

export function SelectionEditor({
  value,
  onUpdate,
  onDelete,
  screenMetadata,
  activeElements,
  setActiveElements,
  setSubNavMode
}) {
  const [showAddForm, toggleShowAddForm] = useBoolean(false);

  const groupedSelection = useMemo(() => {
    return Object.entries(
      groupBy(
        activeElements.map(x => ({
          id: x,
          type: x[0],
          value: drillExtract(value, x)
        })),
        x => x.type
      )
    ).sort(([a], [b]) => a.localeCompare(b));
  }, [value, activeElements]);

  const onDeselectAll = useCallback(() => {
    setActiveElements([]);
  }, []);

  const onDeleteAll = useCallback(() => {
    if (
      confirm(
        `Are you sure you want to delete ${activeElements.length} elements?`
      )
    ) {
      onDelete(activeElements);
    }
  }, [activeElements]);

  const onAdd = useCallback(
    type => {
      const updated = produce(value, draft => {
        if (!draft[type]) {
          draft.type = [{}];
        } else {
          draft[type].push({});
        }
      });

      onUpdate(updated);
      setActiveElements([[type, updated[type].length - 1]]);
      setSubNavMode("editor");
    },
    [value, activeElements, onUpdate]
  );

  const onDeselect = useCallback(
    id => {
      const updated = produce(activeElements, draft => {
        draft.splice(
          activeElements.findIndex(x => x === id),
          1
        );
      });
      setActiveElements(updated);
    },
    [activeElements]
  );

  return (
    <>
      <div className="mt-2 mb-3">
        <h5>Actions</h5>

        <div className="d-flex button-list">
          <Button size="sm" variant="primary" onClick={toggleShowAddForm}>
            <FontAwesomeIcon icon={faPlus} className="fa-fw mr-2" />
            New
          </Button>
          {activeElements.length > 0 && (
            <>
              <Button size="sm" variant="secondary" onClick={onDeselectAll}>
                <FontAwesomeIcon icon={faWindowClose} className="fa-fw mr-2" />
                Deselect All
              </Button>

              <div className="mr-auto" />

              <Button size="sm" variant="danger" onClick={onDeleteAll}>
                <FontAwesomeIcon icon={faTrash} className="fa-fw mr-2" />
                Delete All
              </Button>
            </>
          )}
        </div>

        {showAddForm && <AddElementForm onAdd={onAdd} />}
      </div>

      {activeElements.length == 0 && <i>Nothing selected.</i>}
      {activeElements.length > 0 && (
        <>
          {groupedSelection.map(([type, elements]) => {
            const typeTitle = Schema.properties[type].items.title;
            return (
              <SectionList
                key={type}
                title={typeTitle}
                items={elements}
                onDelete={onDelete}
                onDeselect={onDeselect}
              />
            );
          })}
        </>
      )}
    </>
  );
}
