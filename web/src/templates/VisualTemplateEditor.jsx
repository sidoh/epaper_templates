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
import { useDebounce } from "react-use";
import useGlobalState from "../state/global_state";
import api from "../util/api";
import { drillUpdate } from "../util/mungers";
import SiteLoader from "../util/SiteLoader";
import { FormatterEditor } from "./FormatterEditor";
import { LocationEditor } from "./LocationEditor";
import { MarkedForDeletion } from "./schema";
import { SelectionEditor } from "./SelectionEditor";
import { SvgCanvas } from "./SvgCanvas";
import { SvgFieldEditor } from "./SvgFieldEditor";
import "./VisualTemplateEditor.scss";

const EditorSections = {
  selection: SelectionEditor,
  editor: SvgFieldEditor,
  location: LocationEditor,
  formatters: FormatterEditor
};

function SvgEditor({
  value,
  onChange,
  onUpdateActive,
  screenMetadata,
  activeElements,
  setActiveElements,
  subNavMode,
  setSubNavMode,
  allBitmaps
}) {
  const [globalState, globalActions] = useGlobalState();

  useEffect(() => {
    globalActions.loadBitmaps();
  }, []);

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
      setActiveElements(activeElements.filter(x => !paths.some(p => x === p)));
    },
    [value, onChange, activeElements]
  );

  const Editor = EditorSections[subNavMode] || SvgFieldEditor;

  return (
    <>
      <Editor
        onUpdateActive={onUpdateActive}
        onUpdate={onChange}
        onDelete={onDelete}
        value={value}
        activeElements={activeElements}
        setActiveElements={setActiveElements}
        screenMetadata={screenMetadata}
        allBitmaps={globalState.bitmaps}
        setSubNavMode={setSubNavMode}
      />
    </>
  );
}

function sliceVariableRequest(variables, maxSize = 512) {
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
  const [activeEditElements, setActiveEditElements] = useState([]);

  // Do this to work around RJSF using onChange fn from current props to update next props.
  const currentActiveElements = useRef(null);
  currentActiveElements.current = activeEditElements;

  const onUpdateActive = useCallback(
    updateFn => {
      const updated = produce(value, draft => {
        currentActiveElements.current.forEach(path =>
          drillUpdate(draft, path, updateFn)
        );
      });
      onChange(updated);
    },
    [value, onChange]
  );

  useEffect(() => {
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

    return () => {
      setSubNav([]);
    };
  }, [activeEditElements]);

  const screenMetadata = useMemo(() => {
    const displayType = globalState.settings["display.display_type"];
    return (globalState.screenMetadata.screens || []).find(
      x => x.name === displayType
    );
  }, [globalState.settings, globalState.screenMetadata]);

  const toggleActive = useCallback(
    (elementType, index) => {
      const isActive = activeEditElements.some(
        x => x[0] == elementType && x[1] == index
      );

      if (isActive) {
        setActiveEditElements(
          activeEditElements.filter(x => x[0] !== elementType || x[1] !== index)
        );
      } else {
        setActiveEditElements([...activeEditElements, [elementType, index]]);
      }
    },
    [activeEditElements]
  );

  useDebounce(
    () => {
      const variables = [
        ["text", ["value"]],
        ["bitmaps", ["value"]],
        ["rectangles", ["w", "h"]]
      ].flatMap(([type, keys]) => {
        return (value[type] || [])
          .flatMap((def, i) => {
            if (def === MarkedForDeletion) {
              return {};
            }

            return keys
              .map(k => {
                const { variable, formatter } = def[k] || {};

                if (variable) {
                  return { variable, formatter, ref: [type, i, k] };
                }
              })
              .filter(x => x);
          })
          .filter(x => x.variable);
      });

      const promises = sliceVariableRequest(variables).map(x => {
        return api.post("/formatted_variables", { variables: x });
      });

      Promise.all(promises).then(results => {
        setResolvedVariables(
          results
            .flatMap(x => x.data.resolved_variables)
            .reduce(
              (a, x) => {
                const [type, id] = x.ref;
                a[type][id] = x.value;
                return a;
              },
              { bitmaps: {}, text: {}, rectangles: {} }
            )
        );
      });
    },
    1000,
    [value, globalState.variables]
  );

  useEffect(() => {
    const undoRedo = e => {
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
      }
    };
    document.addEventListener("keydown", undoRedo);

    return () => {
      document.removeEventListener("keydown", undoRedo);
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
                activeElements={activeEditElements}
                resolvedVariables={resolvedVariables}
                markForCollapse={markForCollapse}
                collapse={collapse}
              />
            </Col>

            <Col sm={12} lg={5}>
              <SvgEditor
                value={value}
                onChange={onChange}
                onUpdateActive={onUpdateActive}
                screenMetadata={screenMetadata}
                activeElements={activeEditElements}
                setActiveElements={setActiveEditElements}
                subNavMode={subNavMode}
                setSubNavMode={setSubNavMode}
              />
            </Col>
          </Row>
        </Container>
      )}
    </div>
  );
}

export default VisualTemplateEditor;
