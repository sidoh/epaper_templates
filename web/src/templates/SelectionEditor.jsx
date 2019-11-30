import React, { useMemo, useCallback, useState } from "react";
import { groupBy, drillExtract, setGroupReducer } from "../util/mungers";
import { FieldTypeDefinitions, Schema, MarkedForDeletion } from "./schema";

import "./SelectionEditor.scss";
import Button from "react-bootstrap/Button";
import {
  faWindowClose,
  faPlusSquare,
  faMinusSquare
} from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import produce from "immer";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useBoolean } from "react-use";
import Form from "react-bootstrap/Form";
import Collapse from "react-bootstrap/Collapse";
import { BadgedText } from "./BadgedText";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";

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
  rectangles: fieldTitleGenerator(["x", "y", "style"])
};

function SectionListItem({ id, type, value, onDelete, onToggleSelect }) {
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

  const _onToggleSelect = useCallback(
    e => {
      e.preventDefault();
      onToggleSelect(...id);
    },
    [onToggleSelect, id]
  );

  return (
    <div className="d-flex button-list">
      <a
        href="#"
        onClick={_onToggleSelect}
        className="text-dark mr-auto d-block w-100"
      >
        {titleGenerator(value)}
      </a>

      <a className="text-danger" href="#" onClick={_onDelete} title="Delete">
        <MemoizedFontAwesomeIcon icon={faTrash} />
      </a>
    </div>
  );
}

const SectionList = React.memo(
  ({ title, items, onDelete, onDeselect, toggleActiveElement }) => {
    const [isCollapsed, toggleCollapse] = useBoolean(false);

    const _toggleClick = useCallback(e => {
      e.preventDefault();
      toggleCollapse();
    }, []);

    return (
      <div className="selection-section">
        <h5 className="d-flex">
          <a
            href="#"
            className="text-white"
            style={{ textDecoration: "none" }}
            onClick={_toggleClick}
          >
            <MemoizedFontAwesomeIcon
              icon={isCollapsed ? faPlusSquare : faMinusSquare}
            />
            <span className="ml-2">
              {title} ({items.length})
            </span>
          </a>
          <Button className="ml-auto" variant="outline-success" size="sm">
            <MemoizedFontAwesomeIcon icon={faPlus} />
          </Button>
        </h5>
        <Collapse in={!isCollapsed} unmountOnExit={true}>
          <ul className="block-list">
            {items.map(x => (
              <li key={x.id} className={x.isActive ? "active" : ""}>
                <SectionListItem
                  {...x}
                  hidden={isCollapsed}
                  onDelete={onDelete}
                  onDeselect={onDeselect}
                  onToggleSelect={toggleActiveElement}
                />
              </li>
            ))}
          </ul>
        </Collapse>
      </div>
    );
  }
);

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
  setSubNavMode,
  toggleActiveElement
}) {
  const [showAddForm, toggleShowAddForm] = useBoolean(false);

  const elementsByType = useMemo(() => {
    const active = groupBy(activeElements, x => x[0], {
      valueFn: x => x[1],
      groupReducer: setGroupReducer
    });

    return Object.entries(
      groupBy(
        Object.keys(FieldTypeDefinitions).flatMap(type =>
          (value[type] || [])
            .map((x, i) => ({
              id: [type, i],
              type,
              value: x,
              isActive: !!(active[type] && active[type].has(i))
            }))
            .filter(x => x.value !== MarkedForDeletion)
        ),
        x => x.type
      )
    );
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
          draft[type] = [{}];
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
      <div style={{ height: "50px" }}>
        <h5>Actions</h5>
        {activeElements.length == 0 && <i>Nothing selected.</i>}
        {activeElements.length > 0 && (
          <div className="d-flex button-list">
            <Button size="sm" variant="secondary" onClick={onDeselectAll}>
              <MemoizedFontAwesomeIcon
                icon={faWindowClose}
                className="fa-fw mr-2"
              />
              Deselect All
            </Button>

            <div className="mr-auto" />

            <Button size="sm" variant="danger" onClick={onDeleteAll}>
              <MemoizedFontAwesomeIcon icon={faTrash} className="fa-fw mr-2" />
              Delete All
            </Button>
          </div>
        )}
      </div>

      <>
        {elementsByType.map(([type, elements]) => {
          const typeTitle = Schema.properties[type].items.title;
          return (
            <SectionList
              key={type}
              title={typeTitle}
              items={elements}
              onDelete={onDelete}
              onDeselect={onDeselect}
              toggleActiveElement={toggleActiveElement}
            />
          );
        })}
      </>
    </>
  );
}
