import React, { useState, useEffect, useCallback } from "react";
import Form from "react-jsonschema-form";
import Tab from "react-bootstrap/Tab";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Button from "react-bootstrap/Button";

import schema from "./schema";
import ui_schema from "./ui_schema";
import api from "../util/api";
import SiteLoader from "../util/SiteLoader";
import { CheckboxWidget } from "./CheckboxWidget";
import { SelectWidget } from "./SelectWidget";

const CustomRjsfWidgets = {
  CheckboxWidget: CheckboxWidget,
  SelectWidget: SelectWidget
};

export default props => {
  const [formState, setFormState] = useState(null);
  const [isSaving, setSaving] = useState(false);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (formState == null) {
      api.get("/settings").then(x => {
        const data = x.data;

        Object.entries(ui_schema).map(([field, x]) => {
          if (x.transformer) {
            data[field] = x.transformer(data[field]);
          }
        });

        setFormState(data);
      });
    }
  }, [ui_schema]);

  const onChange = useCallback(
    form => setFormState({ ...formState, ...form.formData }),
    []
  );
  const onSubmit = useCallback(form => {
    setSaving(true);

    // All values must be strings for Bleeper
    const settingsFields = Object.entries(form.formData).map(([k, v]) => [
      k,
      v ? v.toString() : ""
    ]);

    api
      .put("/settings", Object.fromEntries(settingsFields))
      .then(x => setSaving(false), x => setErrors(x));
  }, []);

  return (
    <>
      {formState == null && <SiteLoader />}
      {formState != null && (
        <>
          <h3 className="mb-4">Settings</h3>
          <Tab.Container defaultActiveKey="display">
            <Row>
              <Col sm={3}>
                <Nav variant="pills" className="flex-column">
                  {schema.map(x => (
                    <Nav.Item key={x.key}>
                      <Nav.Link eventKey={x.key}>{x.title}</Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
              </Col>
              <Col sm={9}>
                <Tab.Content>
                  {schema.map(x => (
                    <Tab.Pane key={x.key} eventKey={x.key}>
                      <Form
                        disabled={isSaving}
                        idPrefix={x.key}
                        schema={x.schema}
                        uiSchema={ui_schema}
                        formData={formState}
                        onChange={onChange}
                        onSubmit={onSubmit}
                        widgets={CustomRjsfWidgets}
                      >
                        <Button
                          disabled={isSaving}
                          variant="primary"
                          type="submit"
                        >
                          Save
                        </Button>
                      </Form>
                    </Tab.Pane>
                  ))}
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </>
      )}
    </>
  );
};
