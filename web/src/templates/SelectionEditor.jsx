import React, { useMemo, useCallback } from "react";
import { groupBy, drillExtract } from "../util/mungers";
import { Schema } from "./schema";

import "./SelectionEditor.scss";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import produce from "immer";

function BadgedText({ badge, variant = "primary", children, ...props }) {
  return (
    <span {...props} className="list-item-badge">
      <Badge variant={variant} className="mr-2">
        {badge}
      </Badge>
      {children}
    </span>
  );
}

const valueTitleGenerator = el => {
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

const fieldTitleGenerator = el => {
  return (
    <span>
      {Object.entries(el)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => (
          <BadgedText className="mr-2" key={k} badge={k}>
            {v}
          </BadgedText>
        ))}
    </span>
  );
};

const defaultTitleGenerator = el => {
  return JSON.stringify(el);
};

const SectionListItemTitleGenerators = {
  text: valueTitleGenerator,
  bitmaps: valueTitleGenerator,
  lines: fieldTitleGenerator,
  rectangles: defaultTitleGenerator
};

function SectionListItem({ id, type, value, onDelete }) {
  const titleGenerator = SectionListItemTitleGenerators[type];
  const _onDelete = useCallback(() => {
    onDelete(id);
  }, [onDelete, id]);

  return (
    <div className="d-flex">
      <span className="mr-auto">{titleGenerator(value)}</span>
      <a className="text-danger" href="#" onClick={_onDelete}>
        <FontAwesomeIcon icon={faTrash} />
      </a>
    </div>
  );
}

function SectionList({ title, items, onDelete }) {
  return (
    <div className="selection-section">
      <h5>
        {title} ({items.length})
      </h5>
      <ul>
        {items.map(x => (
          <li key={x.id}>
            <SectionListItem {...x} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SelectionEditor({
  value,
  onDelete,
  screenMetadata,
  activeElements
}) {
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

  return (
    <>
      {activeElements.length == 0 && <i>Nothing selected.</i>}
      {activeElements.length > 0 &&
        groupedSelection.map(([type, elements]) => {
          const typeTitle = Schema.properties[type].items.title;
          return (
            <SectionList
              key={type}
              title={typeTitle}
              items={elements}
              onDelete={onDelete}
            />
          );
        })}
    </>
  );
}
