import React, { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Button from "react-bootstrap/Button";
import SiteLoader from "../util/SiteLoader";
import {
  faSave,
  faTv,
  faTrash,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import { Prompt, useHistory } from "react-router-dom";

import "./TemplateEditor.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import api from "../util/api";
import VisualTemplateEditor from "./VisualTemplateEditor";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import produce from "immer";
import { FieldTypeDefinitions, MarkedForDeletion } from "./schema";
import { useUndoableMap } from "../util/use-undo-reducer";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";
import useGlobalState from "../state/global_state";
import { useLocation, useBoolean } from "react-use";

const RawJsonEditor = ({ value, onChange, setSubNav, isHidden }) => {
  const [internalValue, setInternalValue] = useState("{}");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isHidden) {
      setSubNav([]);
    }
  }, [isHidden]);

  useEffect(() => {
    if (value) {
      setInternalValue(JSON.stringify(value, null, 2));
    }
  }, [value, setInternalValue]);

  const _onChange = useCallback(
    e => {
      setInternalValue(e.target.value);
    },
    [setInternalValue]
  );

  const save = useCallback(
    e => {
      try {
        onChange(JSON.parse(internalValue));
        setError(null);
      } catch (error) {
        setError("Error parsing JSON");
      }
    },
    [onChange, setError, internalValue]
  );

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Control
        as="textarea"
        className="json-textarea"
        style={{ height: "400px" }}
        value={internalValue}
        onChange={_onChange}
        onBlur={save}
      />
    </div>
  );
};

const isHiddenEqual = (n, p) => {
  return n === p || (n.isHidden && p.isHidden);
};

const editorMemoize = c => React.memo(c, isHiddenEqual);

const EditorModeHandlers = {
  json: editorMemoize(RawJsonEditor),
  visual: editorMemoize(VisualTemplateEditor)
};

const SwitchableJsonEditor = ({ value, onChange, ...rest }) => {
  const [subNav, setSubNav] = useState([]);
  const [mode, setMode] = useState("visual");
  const [subNavMode, setSubNavMode] = useState(null);
  const ViewComponent = EditorModeHandlers[mode];

  const updateSubNav = useCallback(
    items => {
      if (subNavMode == null && items.length > 0) {
        setSubNavMode(items.length > 0 ? items[0].key : null);
      }

      setSubNav(items);
    },
    [subNavMode]
  );

  return (
    <>
      <Container fluid className="p-0 m-0">
        <Row>
          <Col sm={12} lg={7}>
            <Nav
              variant="pills"
              activeKey={mode}
              onSelect={setMode}
              className="template-topnav"
            >
              <Nav.Item>
                <Nav.Link eventKey="visual">Visual</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="json">Raw</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col sm={12} lg={5}>
            <Nav
              variant="pills"
              activeKey={subNavMode}
              onSelect={setSubNavMode}
              className="template-topnav"
            >
              {subNav.map(({ key, title }) => (
                <Nav.Item key={key}>
                  <Nav.Link eventKey={key}>{title}</Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </Col>
        </Row>

        {Object.entries(EditorModeHandlers).map(([k, ViewComponent]) => {
          const isHidden = k !== mode;
          return (
            <div key={k} className={isHidden ? "d-none" : "d-block"}>
              <ViewComponent
                isHidden={isHidden}
                value={value}
                onChange={onChange}
                setSubNav={updateSubNav}
                subNavMode={subNavMode}
                setSubNavMode={setSubNavMode}
                {...rest}
              />
            </div>
          );
        })}
      </Container>
    </>
  );
};

export default ({ isActive, path, template, triggerReload }) => {
  const [
    json,
    {
      set: setJson,
      clearHistory,
      undo,
      redo,
      markForCollapse,
      markSaved,
      isSaved,
      collapse
    }
  ] = useUndoableMap();
  const [name, setName] = useState(null);
  const [globalState, globalActions] = useGlobalState();
  const [activeWarningHidden, toggleActiveWarningHidden] = useBoolean(false);
  const isNew = path === "new";
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (template) {
      setJson(template);
      clearHistory();
      markSaved();
    }
  }, [template]);

  useEffect(() => {
    if (isNew) {
      setName("");
      setJson({});
    } else {
      setName(path);
    }
  }, [setName, path]);

  const onChangeName = useCallback(
    e => {
      setName(e.target.value);
    },
    [setName]
  );

  const onActivate = useCallback(
    e => {
      api
        .put("/settings", { "display.template_name": `/t/${name}` })
        .then(triggerReload);
    },
    [name, triggerReload]
  );

  const onSubmit = useCallback(
    e => {
      e.preventDefault();

      const filename = name.endsWith(".json") ? name : `${name}.json`;

      // Filter out items that were marked for deletion
      const updated = produce(json, draft => {
        ["formatters", ...Object.keys(FieldTypeDefinitions)].forEach(
          fieldType => {
            if (draft[fieldType]) {
              draft[fieldType] = draft[fieldType].filter(
                x => x !== MarkedForDeletion
              );
              draft[fieldType].forEach(x => {
                Object.keys(x)
                  .filter(k => k.startsWith("__"))
                  .forEach(k => delete x[k]);
              });
            }
          }
        );
      });

      const data = new FormData();
      const file = new Blob([JSON.stringify(updated)], { type: "text/json" });

      data.append("file", file, filename);
      api.post("/templates", data).then(
        () => {
          triggerReload();
          markSaved();
          onActivate();

          if (!location.pathname.endsWith(filename)) {
            history.push(`/templates/${filename}`);
          }

          setJson(updated);
          markSaved();
        },
        e => {
          globalActions.addError("Error saving: " + e);
        }
      );
    },
    [triggerReload, path, name, json]
  );

  const onDelete = useCallback(
    e => {
      if (confirm("Are you sure you want to delete this template?")) {
        api.delete(`/templates/${path}`).then(() => {
          triggerReload();
          history.push("/templates");
        });
      }
    },
    [triggerReload, path, name, json]
  );

  return (
    <>
      {globalState.errors.map((msg, i) => {
        return (
          <Alert
            variant="danger"
            onClose={() => globalActions.dismissError(i)}
            dismissible
          >
            {msg}
          </Alert>
        );
      })}
      <Prompt
        when={!isSaved}
        message={
          "You have unsaved changes.  Are you sure you want to leave this page?"
        }
      />
      <Form onSubmit={onSubmit}>
        {(json == null || name == null) && <SiteLoader />}
        {json != null && name != null && (
          <>
            {!isNew && !isActive && !activeWarningHidden && (
              <Alert
                dismissible
                onClose={e => toggleActiveWarningHidden()}
                variant="secondary"
              >
                <h5 className="text-warning">
                  <MemoizedFontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="fa-fw mr-2"
                  />
                  This template isn't active.
                </h5>

                <p>
                  Variables using reference formatters will not be properly
                  formatted. To fix this, activate this template:
                </p>

                <Button variant="primary" onClick={onActivate}>
                  <MemoizedFontAwesomeIcon
                    className="fa-fw mr-1"
                    size="sm"
                    icon={faTv}
                  />
                  <span>Activate</span>
                </Button>
              </Alert>
            )}

            {isNew && (
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  name="name"
                  value={name}
                  onChange={onChangeName}
                />
              </Form.Group>
            )}

            <Form.Group>
              <Container>
                <Row>
                  <Col md={8} lg={1} className="px-lg-0 py-lg-0 pb-4">
                    <div className="button-sidebar d-flex flex-lg-column flex-row">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        className="w-100"
                      >
                        <MemoizedFontAwesomeIcon
                          className="fa-fw mr-1"
                          size="sm"
                          icon={faSave}
                        />
                        <span>Save</span>
                      </Button>

                      <div className="gutter" />

                      {!isNew && (
                        <>
                          <Button
                            variant="secondary"
                            onClick={onActivate}
                            size="sm"
                          >
                            <MemoizedFontAwesomeIcon
                              className="fa-fw mr-1"
                              size="sm"
                              icon={faTv}
                            />
                            <span>Activate</span>
                          </Button>

                          <div className="spacer"></div>

                          <Button variant="danger" onClick={onDelete} size="sm">
                            <MemoizedFontAwesomeIcon
                              className="fa-fw mr-1"
                              size="sm"
                              icon={faTrash}
                            />
                            <span>Delete</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </Col>
                  <Col sm={12} md={11}>
                    <SwitchableJsonEditor
                      value={json}
                      onChange={setJson}
                      {...{ undo, redo, collapse, markForCollapse }}
                    />
                  </Col>
                </Row>
              </Container>
            </Form.Group>
          </>
        )}
      </Form>
    </>
  );
};
