import React, { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Button from "react-bootstrap/Button";
import SiteLoader from "../util/SiteLoader";
import { faSave, faTv, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useHistory } from "react-router-dom";

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

const RawJsonEditor = ({ value, onChange }) => {
  const [internalValue, setInternalValue] = useState("{}");
  const [error, setError] = useState(null);

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

const EditorModeHandlers = {
  json: RawJsonEditor,
  visual: VisualTemplateEditor
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

        <ViewComponent
          value={value}
          onChange={onChange}
          setSubNav={updateSubNav}
          subNavMode={subNavMode}
          setSubNavMode={setSubNavMode}
          {...rest}
        />
      </Container>
    </>
  );
};

export default ({ path, template, triggerReload }) => {
  // const [json, setJson] = useState(null);
  const [
    json,
    { set: setJson, clearHistory, undo, redo, markForCollapse, collapse }
  ] = useUndoableMap();
  const [name, setName] = useState(null);
  const isNew = path === "new";
  const history = useHistory();

  useEffect(() => {
    if (template) {
      setJson(template);
      clearHistory();
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
            }
          }
        );
      });

      const data = new FormData();
      const file = new Blob([JSON.stringify(updated)], { type: "text/json" });

      data.append("file", file, filename);
      api.post("/templates", data).then(() => {
        triggerReload();
        history.push(`/templates/${filename}`);
        setJson(updated);
      });
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

  const onActivate = useCallback(
    e => {
      api
        .put("/settings", { "display.template_name": `/t/${name}` })
        .then(triggerReload);
    },
    [name, triggerReload]
  );

  return (
    <Form onSubmit={onSubmit}>
      {(json == null || name == null) && <SiteLoader />}
      {json != null && name != null && (
        <>
          {isNew && (
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control name="name" value={name} onChange={onChangeName} />
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
  );
};
