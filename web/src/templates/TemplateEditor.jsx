import React, { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Button from "react-bootstrap/Button";
import SiteLoader from "../util/SiteLoader";
import ReactJson from "react-json-view";
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

const TreeJsonEditor = ({ value, onChange }) => {
  const _onChange = useCallback(
    e => {
      onChange(e.updated_src);
    },
    [onChange]
  );

  return <ReactJson src={value} onEdit={_onChange} theme="solarized" />;
};

const EditorModeHandlers = {
  tree: TreeJsonEditor,
  json: RawJsonEditor,
  visual: VisualTemplateEditor
};

const SwitchableJsonEditor = ({ value, onChange }) => {
  const [subNav, setSubNav] = useState([]);
  const [mode, setMode] = useState("visual");
  const [subNavMode, setSubNavMode] = useState(null);
  const ViewComponent = EditorModeHandlers[mode];

  const updateSubNav = useCallback((items) => {
    if (subNavMode == null && items.length > 0) {
      setSubNavMode(items.length > 0 ? items[0].key : null);
    }

    setSubNav(items);
  }, [subNavMode])

  return (
    <>
      <Container fluid className="p-0 m-0">
        <Row>
          <Col sm={12} lg={7}>
            <Nav
              variant="pills"
              activeKey={mode}
              onSelect={setMode}
              className="mb-2"
            >
              <Nav.Item>
                <Nav.Link eventKey="visual">Visual</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="tree">Tree</Nav.Link>
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
              className="mb-2"
            >
              {subNav.map(({ key, title }) => (
                <Nav.Item key={key}>
                  <Nav.Link eventKey={key}>
                    {title}
                  </Nav.Link>
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
        />
      </Container>
    </>
  );
};

export default ({ path, template, triggerReload }) => {
  const [json, setJson] = useState(null);
  const [name, setName] = useState(null);
  const isNew = path === "new";
  const history = useHistory();

  useEffect(() => {
    setJson(template);
  }, [setJson, template]);

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
        Object.keys(FieldTypeDefinitions).forEach(fieldType => {
          if (draft[fieldType]) {
            draft[fieldType] = draft[fieldType].filter(x => x !== MarkedForDeletion)
          }
        })
      })

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
      api.delete(`/templates/${path}`).then(() => {
        triggerReload();
        history.push("/templates");
      });
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
            <SwitchableJsonEditor value={json} onChange={setJson} />
          </Form.Group>

          <div className="d-flex">
            <Button type="submit" variant="primary">
              <FontAwesomeIcon className="fa-fw mr-1" icon={faSave} />
              Save
            </Button>

            {!isNew && (
              <>
                <Button
                  variant="secondary"
                  className="ml-2"
                  onClick={onActivate}
                >
                  <FontAwesomeIcon className="fa-fw mr-1" icon={faTv} />
                  Activate Template
                </Button>

                <div className="flex-grow-1"></div>

                <Button variant="danger" onClick={onDelete}>
                  <FontAwesomeIcon className="fa-fw mr-1" icon={faTrash} />
                  Delete
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </Form>
  );
};
