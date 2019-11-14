import { faPlus, faTv } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import { NavLink, useRouteMatch } from "react-router-dom";
import api from "../util/api";
import SiteLoader from "../util/SiteLoader";
import TemplateEditor from "./TemplateEditor";

const TemplatesList = ({
  templates,
  activeTemplate,
  onSelect,
  selectedValue
}) => {
  return (
    <Nav activeKey={selectedValue} variant="pills" className="flex-column">
      {templates
        .sort((x, y) => x.name.localeCompare(y.name))
        .map(x => {
          const displayName = x.name
            .split("/")
            .slice(-1)[0]
            .replace(/\.json$/, "");

          return (
            <Nav.Item key={x.name}>
              <NavLink
                className="nav-link d-flex"
                to={`/templates/${displayName}.json`}
              >
                <span className="flex-grow-1">{displayName}</span>
                {activeTemplate == x.name && (
                  <FontAwesomeIcon className="fa-sm mt-1" icon={faTv} />
                )}
              </NavLink>
            </Nav.Item>
          );
        })}

      <hr />

      <Nav.Item key="new">
        <NavLink to="/templates/new" className="nav-link bg-success">
          <FontAwesomeIcon className="fa-fw mr-1" icon={faPlus} />
          New
        </NavLink>
      </Nav.Item>
    </Nav>
  );
};

export default props => {
  const { params: { template_name: templateName } = {} } =
    useRouteMatch("/templates/:template_name") || {};
  const [templates, setTemplates] = useState(null);
  const [templateContents, setTemplateContents] = useState({});
  const selectedTemplateContents =
    templateName && templateContents[templateName];
  const [activeTemplate, setActiveTemplate] = useState(null);

  const triggerReload = useCallback(() => {
    api.get("/templates").then(x => setTemplates(x.data));

    api.get("/settings").then(x => {
      setActiveTemplate(x.data["display.template_name"]);
    });
  }, [setActiveTemplate, templates, setTemplates]);

  useEffect(() => {
    if (templates == null) {
      triggerReload();
    }
  }, [triggerReload, templates]);

  useEffect(() => {
    if (
      templateName &&
      templateName !== "new" &&
      !templateContents[templateName]
    ) {
      api
        .get(`/templates/${templateName}`)
        .then(x =>
          setTemplateContents({ ...templateContents, [templateName]: x.data })
        );
    }
  }, [templateName, templateContents]);

  return (
    <>
      {templates == null && <SiteLoader />}
      {templates != null && (
        <>
          <h3 className="mb-4">Templates</h3>
          <Row>
            <Col sm={3}>
              <TemplatesList
                activeTemplate={activeTemplate}
                templates={templates}
              />
            </Col>
            <Col sm={9}>
              {templateName && (
                <TemplateEditor
                  path={templateName}
                  template={selectedTemplateContents}
                  triggerReload={triggerReload}
                />
              )}
            </Col>
          </Row>
        </>
      )}
    </>
  );
};
