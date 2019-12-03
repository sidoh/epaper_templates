import {
  faMinusSquare,
  faPlusSquare,
  faWindowClose
} from "@fortawesome/free-regular-svg-icons";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import produce from "immer";
import React, { useCallback, useMemo } from "react";
import Button from "react-bootstrap/Button";
import Collapse from "react-bootstrap/Collapse";
import { useBoolean } from "react-use";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";
import { groupBy, setGroupReducer } from "../util/mungers";
import { BadgedText } from "./BadgedText";
import {
  createDefaultElement,
  FieldTypeDefinitions,
  MarkedForDeletion,
  Schema,
  ScreenSettingsSchema
} from "./schema";
import "./SelectionEditor.scss";
import Form from "react-jsonschema-form";

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

function SectionListItem({ id, type, value, onClick, onDelete, onToggleSelect }) {
  const titleGenerator = SectionListItemTitleGenerators[type] || defaultTitleGenerator;

  const _onDelete = useCallback(
    e => {
      e.preventDefault();

      if (confirm("Are you sure you want to delete this element?")) {
        onDelete([id]);
      }
    },
    [onDelete, id]
  );

  const _onClick = useCallback((e) => {
    onClick(e, id);
  }, [id, onClick])

  return (
    <div className="d-flex button-list">
      <a
        href="#"
        onClick={_onClick}
        className="text-dark mr-auto d-block w-100 h-100"
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
  ({
    title,
    type,
    items,
    onDelete,
    onDeselect,
    activeElements,
    toggleActiveElement,
    setActiveElements,
    onAdd
  }) => {
    const _onAdd = useCallback(
      e => {
        onAdd(type);
      },
      [onAdd, type]
    );

    const _onClick = useCallback((e, id) => {
      e.preventDefault();

      if (e.metaKey || e.ctrlKey) {
        toggleActiveElement(...id)
      } else if (e.shiftKey) {
        const [type, index] = id;
        const first = activeElements.find(x => x[0] === type)

        if (!first || first[1] == index) {
          setActiveElements([id])
        } else {
          const [, anchorId] = first
          const start = Math.min(index, anchorId);
          const end = Math.max(index, anchorId);
          const range = [...Array(end-start+1).keys()].map(x => [type, start+x])

          setActiveElements(range)
        }
      } else {
        setActiveElements([id])
      }
    }, [toggleActiveElement, setActiveElements])

    return (
      <CollapsibleSection
        title={`${title} (${items.length})`}
        onActionButtonClick={_onAdd}
      >
        <ul className="block-list">
          {items.map(x => (
            <li key={x.id} className={x.isActive ? "active" : ""}>
              <SectionListItem
                {...x}
                onClick={_onClick}
                onDelete={onDelete}
                onDeselect={onDeselect}
                onToggleSelect={toggleActiveElement}
              />
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    );
  }
);

const CollapsibleSection = ({
  title,
  children,
  onActionButtonClick,
  actionButtonVariant = "outline-success",
  actionButtonIcon = faPlus
}) => {
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
          <span className="ml-2">{title}</span>
        </a>
        {onActionButtonClick && (
          <Button
            className="ml-auto"
            variant={actionButtonVariant}
            size="sm"
            onClick={onActionButtonClick}
          >
            <MemoizedFontAwesomeIcon icon={actionButtonIcon} />
          </Button>
        )}
      </h5>
      <Collapse in={!isCollapsed} unmountOnExit={true}>
        {children}
      </Collapse>
    </div>
  );
};

const PropertiesForm = ({ value, onChange }) => {
  const _onChange = useCallback((e) => {
    onChange({...value, ...e.formData});
  }, [onChange, value])

  return (
      <CollapsibleSection title="Properties">
        <Form
          schema={ScreenSettingsSchema}
          formData={value}
          onChange={_onChange}
          omitExtraData={true}
          liveOmit={true}
          idPrefix="screen_settings"
          tagName="div"
         >
           <span></span>
        </Form>
      </CollapsibleSection>
  )
}

export function SelectionEditor({
  value,
  onUpdate,
  onDelete,
  screenMetadata,
  activeElements,
  setActiveElements,
  setSubNavMode,
  toggleActiveElement,
  setCreatingElement
}) {
  const elementsByType = useMemo(() => {
    const active = groupBy(activeElements, x => x[0], {
      valueFn: x => x[1],
      groupReducer: setGroupReducer
    });

    return Object.keys(FieldTypeDefinitions)
      .sort()
      .map(type => [
        type,
        (value[type] || [])
          .map((x, i) => ({
            id: [type, i],
            type,
            value: x,
            isActive: !!(active[type] && active[type].has(i))
          }))
          .filter(x => x.value !== MarkedForDeletion)
      ]);
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
        const value = {
          __creating: type,
        };

        if (!draft[type]) {
          draft[type] = [value];
        } else {
          draft[type].push(value);
        }
      });

      const newElementId = [type, updated[type].length - 1];

      setCreatingElement(newElementId);
      setActiveElements([newElementId]);
      onUpdate(updated);
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

      <PropertiesForm value={value} onChange={onUpdate} />

      <>
        {elementsByType.map(([type, elements]) => {
          const typeTitle = Schema.properties[type].items.title;
          return (
            <SectionList
              key={type}
              type={type}
              onAdd={onAdd}
              title={typeTitle}
              items={elements}
              onDelete={onDelete}
              onDeselect={onDeselect}
              activeElements={activeElements}
              toggleActiveElement={toggleActiveElement}
              setActiveElements={setActiveElements}
            />
          );
        })}
      </>
    </>
  );
}
