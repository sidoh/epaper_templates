import React, { useMemo } from "react";
import { groupBy, drillExtract } from "../util/mungers";
import { Schema } from "./schema";

import "./SelectionEditor.scss";

const valueTitleGenerator = el => {
  const { value } = el;

  if (value) {
    if (value.type === "static") {
      return `static: ${value.value}`;
    } else if (value.type === "variable") {
      return `variable: ${value.variable}`;
    }
  }

  return <i>Unrecognized format</i>;
};

const defaultTitleGenerator = el => {
  return JSON.stringify(el);
};

const SectionListItemTitleGenerators = {
  text: valueTitleGenerator,
  bitmaps: valueTitleGenerator,
  lines: defaultTitleGenerator,
  rectangles: defaultTitleGenerator
};

function SectionListItem({ id, type, value, onDelete }) {
  const titleGenerator = SectionListItemTitleGenerators[type];

  return titleGenerator(value);
}

function SectionList({ title, items, onDelete }) {
  return (
    <>
      <h5>
        {title} ({items.length})
      </h5>
      <ul className="selection-section">
        {items.map(x => (
          <li key={x.id}>
            <SectionListItem {...x} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </>
  );
}

export function SelectionEditor({
  value,
  onUpdate,
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
    );
  }, [value, activeElements]);

  return (
    <>
      {activeElements.length == 0 && <i>Nothing selected.</i>}
      {activeElements.length > 0 &&
        groupedSelection.map(([type, elements]) => {
          const typeTitle = Schema.properties[type].items.title;
          return <SectionList key={type} title={typeTitle} items={elements} />;
        })}
    </>
  );
}
