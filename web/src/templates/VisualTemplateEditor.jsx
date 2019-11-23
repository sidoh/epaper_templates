import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import produce from "immer";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Form from "react-jsonschema-form";
import { useDebounce } from "react-use";
import { binToDataUrl } from "../bitmaps/BitmapCanvas";
import useGlobalState from "../state/global_state";
import api from "../util/api";
import { drillUpdate, drillExtract } from "../util/mungers";
import SiteLoader from "../util/SiteLoader";
import createSchema from "./schema";
import { SvgCanvas } from "./SvgCanvas";
import { SvgFieldEditor } from "./SvgFieldEditor";
import { DimensionsEditor } from "./DimensionsEditor";

const EditorSections = {
  editor: SvgFieldEditor,
  dimensions: DimensionsEditor
};

function SvgEditor({
  value,
  onChange,
  screenMetadata,
  activeElements,
  subNavMode
}) {
  const onUpdate = useCallback(
    updateFn => {
      const updated = produce(
        value,
        draft => {
          activeElements.forEach(path => drillUpdate(draft, path, updateFn));
        }
      );
      onChange(updated);
    },
    [value, activeElements]
  );
  const Editor = EditorSections[subNavMode] || SvgFieldEditor;

  return (
    <>
      {activeElements.length == 0 && <i>Select an element.</i>}
      {activeElements.length > 0 && (
        <Editor
          onUpdate={onUpdate}
          value={value}
          activeElements={activeElements}
          screenMetadata={screenMetadata}
        />
      )}
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
  subNavMode
}) {
  const [globalState, globalActions] = useGlobalState();
  const [resolvedVariables, setResolvedVariables] = useState({
    bitmaps: {},
    text: {}
  });
  const [activeEditElements, setActiveEditElements] = useState([]);

  useEffect(() => {
    let editorTitle = "Editor";
    editorTitle +=
      (activeEditElements.length > 0 && ` (${activeEditElements.length})`) ||
      "";

    setSubNav([
      { key: "editor", title: editorTitle },
      { key: "dimensions", title: "Dimensions" }
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
      const variables = ["text", "bitmaps"].flatMap(x => {
        return (value[x] || [])
          .map(({ value: { variable, formatter } = {} }, i) => {
            return { variable, formatter, ref: [x, i] };
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
              { bitmaps: {}, text: {} }
            )
        );
      });
    },
    1000,
    [value, globalState.variables]
  );

  return (
    <div className="visual-editor">
      {!screenMetadata && <SiteLoader />}
      {screenMetadata && (
        <Container fluid={true} className="p-0">
          <Row>
            <Col sm={12} lg={7}>
              <SvgCanvas
                width={screenMetadata.width}
                height={screenMetadata.height}
                definition={value}
                toggleActiveElement={toggleActive}
                activeElements={activeEditElements}
                resolvedVariables={resolvedVariables}
              />
            </Col>

            <Col sm={12} lg={5}>
              <SvgEditor
                value={value}
                onChange={onChange}
                screenMetadata={screenMetadata}
                activeElements={activeEditElements}
                subNavMode={subNavMode}
              />
            </Col>
          </Row>
        </Container>
      )}
    </div>
  );
}

export default VisualTemplateEditor;
