import produce from "immer";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { useDebounce, useMap } from "react-use";
import useGlobalState from "../state/global_state";
import api, { useEpaperWebsocket } from "../util/api";
import { drillUpdate, drillFilter } from "../util/mungers";
import SiteLoader from "../util/SiteLoader";
import { FormatterEditor } from "./FormatterEditor";
import { LocationEditor } from "./LocationEditor";
import { MarkedForDeletion } from "./schema";
import { SelectionEditor } from "./SelectionEditor";
import { SvgCanvas } from "./SvgCanvas";
import { SvgFieldEditor } from "./SvgFieldEditor";
import "./VisualTemplateEditor.scss";
import deepmerge from "deepmerge";
import { onUpdateLocation } from "./template_updaters";

const isHiddenEqual = (n, p) => {
  return n === p || (n.isDragging && p.isDragging);
};

const EditorSections = {
  selection: React.memo(SelectionEditor, isHiddenEqual),
  editor: React.memo(SvgFieldEditor, isHiddenEqual),
  location: React.memo(LocationEditor, isHiddenEqual),
  formatters: React.memo(FormatterEditor, isHiddenEqual)
};

const RegionTypeKeys = {
  t: "text",
  b: "bitmaps",
  r: "rectangles",
  l: "lines"
};

const parseRegionIdentifier = key => {
  const [typeKey, id] = key.split("-");
  return [RegionTypeKeys[typeKey], id];
};

const generateRegionIdentifier = (type, index) => {
  const [key] = Object.entries(RegionTypeKeys).find(([k, v]) => v === type);
  return `${key}-${index}`;
};

const regionIterator = (defn, fn) => {
  Object.values(RegionTypeKeys).forEach(key => {
    (defn[key] || []).forEach((regionDef, i) => {
      const id = generateRegionIdentifier(key, i);
      fn({
        region: regionDef,
        type: key,
        index: i,
        id
      });
    });
  });
};

function SvgEditor({ subNavMode, onChange, ...rest }) {
  const [globalState, globalActions] = useGlobalState();

  useEffect(() => {
    globalActions.loadBitmaps();
  }, []);

  return (
    <>
      {Object.entries(EditorSections).map(([k, Editor]) => (
        <div key={k} className={k === subNavMode ? "d-block" : "d-none"}>
          <Editor
            isHidden={k !== subNavMode}
            allBitmaps={globalState.bitmaps}
            onUpdate={onChange}
            {...rest}
          />
        </div>
      ))}
    </>
  );
}

function sliceVariableRequest(variables, maxSize = 250) {
  const requests = [];
  let currentRequest = [];

  variables.forEach(x => {
    if (JSON.stringify([...currentRequest, x]).length > maxSize) {
      requests.push(currentRequest);
      currentRequest = [];
    }
    currentRequest.push(x);
  });

  requests.push(currentRequest);

  return requests;
}

export function VisualTemplateEditor({
  value,
  onChange,
  isHidden,
  setSubNav,
  subNavMode,
  setSubNavMode,
  undo,
  redo,
  collapse,
  markForCollapse
}) {
  const [globalState, globalActions] = useGlobalState();
  const [resolvedVariables, setResolvedVariables] = useState({
    bitmaps: {},
    text: {}
  });
  const [rvIndex, { set: setRvIndex }] = useMap();
  const [activeEditElements, setActiveEditElements] = useState([]);
  const [isDragging, setDragging] = useState(false);
  const [creatingElement, setCreatingElement] = useState(null);
  const [sendMessage, lastMessage, readyState] = useEpaperWebsocket();

  // Do this to work around RJSF using onChange fn from current props to update next props.
  const currentActiveElements = useRef(null);
  currentActiveElements.current = activeEditElements;

  const currentValue = useRef(null);
  currentValue.current = value;

  const currentRvIndex = useRef(null);
  currentRvIndex.current = rvIndex;

  const onUpdateActive = useCallback(
    (updateFn, meta = {}) => {
      const wrappedFn = x => {
        if (typeof x === "object") {
          updateFn(x);
        }
      };

      const updated = produce(currentValue.current, draft => {
        currentActiveElements.current.forEach(path =>
          drillUpdate(draft, path, wrappedFn)
        );
      });
      onChange(updated, meta);
    },
    [onChange]
  );

  useEffect(() => {
    if (!isHidden) {
      let selectionTitle = "Selection";
      selectionTitle +=
        (activeEditElements.length > 0 && ` (${activeEditElements.length})`) ||
        "";

      setSubNav([
        { key: "selection", title: selectionTitle },
        { key: "editor", title: "Editor" },
        { key: "location", title: "Location" },
        { key: "formatters", title: "Formatters" }
      ]);
    }
  }, [isHidden, activeEditElements]);

  const screenMetadata = useMemo(() => {
    const displayType = globalState.settings["display.display_type"];
    return (globalState.screenMetadata.screens || []).find(
      x => x.name === displayType
    );
  }, [globalState.settings, globalState.screenMetadata]);

  const toggleActive = useCallback(
    (elementType, index) => {
      const currIndex = activeEditElements.findIndex(
        x => x[0] == elementType && x[1] == index
      );

      const updated = produce(activeEditElements, draft => {
        if (currIndex === -1) {
          draft.push([elementType, index]);
        } else {
          draft.splice(currIndex, 1);
        }
      });

      setActiveEditElements(updated);
    },
    [activeEditElements]
  );

  useEffect(() => {
    api.get("/resolve_variables").then(
      x => {
        const draft = {};

        Object.entries(x.data.variables).forEach(([key, variables]) => {
          const [type, id] = parseRegionIdentifier(key);

          if (!draft[type]) {
            draft[type] = {};
          }

          draft[type][id] = Object.fromEntries(variables);
        });

        setResolvedVariables(draft);
      },
      err => {
        globalActions.addError("Error resolving variables: " + err.message);
      }
    );
  }, []);

  useDebounce(
    () => {
      if (currentRvIndex.current) {
        regionIterator(value, ({ region, id }) => {
          const value = region.value;
          const indexValue = currentRvIndex.current[id];

          if (value !== indexValue && value && value.type === "variable") {
            const message = {
              type: "resolve",
              variables: [[value.variable, value.formatter, id]]
            };
            sendMessage(JSON.stringify(message));
            setRvIndex(id, value);
          }
        });
      }
    },
    100,
    [value]
  );

  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      try {
        const parsed = JSON.parse(lastMessage.data);
        const next = produce(resolvedVariables, draft => {
          parsed.forEach(x => {
            if (x.ref !== undefined && x.v) {
              const [type, id] = parseRegionIdentifier(x.ref);
              if (!draft[type][id]) {
                draft[type][id] = {[x.k]: x.v}
              } else {
                draft[type][id][x.k] = x.v;
              }
            }
          });
        });
        setResolvedVariables(next);
      } catch (err) {
        console.log(err);
        console.warn("unparsed websocket message", lastMessage.data);
      }
    }
  }, [resolvedVariables, rvIndex, lastMessage]);

  const onDelete = useCallback(
    paths => {
      const updated = produce(value, draft => {
        paths.forEach(path => {
          let _path = path.slice();
          let curr = draft;

          while (_path.length > 0) {
            const [next, ...rest] = _path;

            if (rest.length > 0) {
              curr = curr[next];
            } else {
              curr.splice(next, 1, MarkedForDeletion);
            }

            _path = rest;
          }
        });
      });
      onChange(updated);
      setActiveEditElements(
        activeEditElements.filter(x => !paths.some(p => x === p))
      );
    },
    [value, onChange, activeEditElements]
  );
  // avoid the need to re-mount event listeners
  const _currentOnDelete = useRef(null);
  _currentOnDelete.current = onDelete;

  useEffect(() => {
    const shouldSkip = e => {
      // Skip if the target is an input field
      const tagName = e.target.tagName.toLowerCase();
      return tagName === "input" || tagName === "textarea";
    };

    const shortcutsHandler = e => {
      if (shouldSkip(e)) {
        return;
      }

      var keyCode = e.keyCode;

      if (e.metaKey === true || e.ctrlKey === true) {
        if (keyCode === 89) {
          redo();
          e.preventDefault();
          return false;
        } else if (keyCode === 90) {
          if (e.shiftKey === true) {
            redo();
          } else {
            undo();
          }

          e.preventDefault();
          return false;
        }
      } else if (keyCode === 8) {
        if (
          e.target.tagName.toLowerCase() === "body" &&
          currentActiveElements.current.length > 0 &&
          confirm(
            "Are you sure you want to delete " +
              currentActiveElements.current.length +
              " elements?"
          )
        ) {
          _currentOnDelete.current(currentActiveElements.current);
        }
      } else if (keyCode >= 37 && keyCode <= 40) {
        if (currentActiveElements.current.length > 0) {
          e.preventDefault();
        }

        const dimension = keyCode % 2 == 0 ? "y" : "x";
        const amount = 5 * (keyCode <= 38 ? -1 : 1) * (e.shiftKey ? 1 / 5 : 1);

        onUpdateLocation(onUpdateActive, dimension, amount);
      }
    };

    const copyHandler = e => {
      if (shouldSkip(e)) {
        return;
      }

      e.preventDefault();
      const data = drillFilter(
        currentValue.current,
        currentActiveElements.current
      );
      e.clipboardData.setData("text/json", JSON.stringify(data, null, 2));
    };

    const pasteHandler = e => {
      if (shouldSkip(e)) {
        return;
      }

      e.preventDefault();

      const extractBound = (data, keys, fn) => {
        const paths = keys.map(x => [x]);
        const b = Object.values(data)
          .flat()
          .map(x => drillFilter(x, paths))
          .flatMap(x => Object.values(x))
          .filter(x => x !== undefined);
        return b.reduce((a, x) => fn(a, x));
      };

      try {
        const data = JSON.parse(e.clipboardData.getData("text/json"));
        const paths = Object.keys(data).flatMap(type => {
          return [...Array(data[type].length).keys()].map(i => [type, i]);
        });

        const xBound = extractBound(data, ["x1", "x2", "x"], Math.min);
        const yBound = extractBound(data, ["y1", "y2", "y"], Math.min);

        const updated = produce(data, draft => {
          paths.forEach(path => {
            drillUpdate(draft, path, x => {
              ["x1", "x2", "x", "y1", "y2", "y"].forEach(d => {
                if (x[d] !== undefined) {
                  x[d] += 20;
                }
              });
            });
          });
        });

        const newValue = deepmerge(currentValue.current, updated);

        // Compute paths after merging into existing template
        const newPaths = Object.keys(data).flatMap(type => {
          return [...Array(data[type].length).keys()].map(i => [
            type,
            (currentValue.current[type] || []).length + i
          ]);
        });

        onChange(newValue);
        setActiveEditElements(newPaths);
      } catch (error) {
        console.warn("Couldn't parse clipboard text", error);
      }
    };

    document.addEventListener("keydown", shortcutsHandler);
    document.addEventListener("copy", copyHandler);
    document.addEventListener("paste", pasteHandler);

    return () => {
      document.removeEventListener("keydown", shortcutsHandler);
      document.removeEventListener("copy", copyHandler);
      document.removeEventListener("paste", pasteHandler);
    };
  }, []);

  return (
    <div className="visual-editor">
      {!screenMetadata && <SiteLoader />}
      {screenMetadata && (
        <Container fluid={true} className="p-0">
          <Row>
            <Col sm={12} lg={7}>
              <SvgCanvas
                onUpdateActive={onUpdateActive}
                width={screenMetadata.width}
                height={screenMetadata.height}
                definition={value}
                toggleActiveElement={toggleActive}
                setActiveElements={setActiveEditElements}
                activeElements={activeEditElements}
                resolvedVariables={resolvedVariables}
                markForCollapse={markForCollapse}
                collapse={collapse}
                setDragging={setDragging}
                creatingElement={creatingElement}
                setCreatingElement={setCreatingElement}
              />
            </Col>

            <Col sm={12} lg={5} className="mt-lg-0 mt-sm-3 scroll-pane">
              <SvgEditor
                value={value}
                onChange={onChange}
                onDelete={onDelete}
                onUpdateActive={onUpdateActive}
                screenMetadata={screenMetadata}
                activeElements={activeEditElements}
                setActiveElements={setActiveEditElements}
                subNavMode={subNavMode}
                setSubNavMode={setSubNavMode}
                toggleActiveElement={toggleActive}
                isDragging={isDragging}
                creatingElement={creatingElement}
                setCreatingElement={setCreatingElement}
              />
            </Col>
          </Row>
        </Container>
      )}
    </div>
  );
}

export default VisualTemplateEditor;
