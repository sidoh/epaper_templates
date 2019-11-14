import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../util/api";
import Card from "react-bootstrap/Card";
import SiteLoader from "../util/SiteLoader";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";

import "./Dashboard.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPowerOff,
  faRedoAlt,
  faCheck
} from "@fortawesome/free-solid-svg-icons";
import { useInterval, useBoolean } from "react-use";

const DisplayStatusCard = ({ settings }) => {
  return (
    <Card>
      <Card.Header as="h5">Display</Card.Header>
      <Card.Body>
        {settings == null && <SiteLoader size="sm" />}
        {settings != null && (
          <>
            <h6>Display Type</h6>
            <p>{settings["display.display_type"]}</p>

            <h6>Current Template</h6>
            <p>{settings["display.template_name"]}</p>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

const SystemStatusCard = ({ systemStatus }) => {
  const [isRebooting, toggleRebooting] = useBoolean(false);
  const [isFormShowing, toggleFormShowing] = useBoolean(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const firmwareFile = useRef(null);

  useInterval(
    () => {
      api
        .get("/system", { timeout: 1000 })
        .then(() => toggleRebooting())
        .catch(e => console.log("Caught exception", e));
    },
    isRebooting ? 5000 : null
  );

  const reboot = useCallback(e => {
    e.preventDefault();

    if (confirm("Are you sure you want to reboot?")) {
      toggleRebooting();
      api.post("/system", { command: "reboot" }, { timeout: 1000 });
    }
  }, []);

  const onFirmwareSubmit = useCallback(e => {
    e.preventDefault();

    if (firmwareFile.current.files.length > 0) {
      toggleFormShowing();
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append("file", firmwareFile.current.files[0]);

      const config = {
        baseURL: "/",
        onUploadProgress: e => {
          setUploadProgress(Math.floor((100 * e.loaded) / e.total));
        }
      };

      api.post("/firmware", formData, config).then(e => {
        setUploadProgress(null);
        toggleRebooting();
        setSuccessMessage("Firmware updated successfully.");
      });
    }
  });

  return (
    <Card>
      <Card.Header as="h5">System</Card.Header>
      <Card.Body>
        {systemStatus == null && <SiteLoader size="sm" />}
        {systemStatus != null && (
          <>
            <h6>Version</h6>
            <p>{systemStatus["version"]}</p>

            <h6>Free Heap</h6>
            <p>{Math.round(systemStatus["free_heap"] / 1024)} KiB</p>

            {isRebooting && (
              <Alert variant="secondary" className="d-flex">
                <SiteLoader size="sm" />
                <span className="ml-2 text-bold">
                  <b>Rebooting...</b>
                </span>
              </Alert>
            )}

            {uploadProgress !== null && (
              <Alert variant="secondary" className="d-flex">
                <SiteLoader size="sm" />
                <span className="ml-2 text-bold">
                  <b>Uploading...</b>
                  <span className="ml-2">{uploadProgress}%</span>
                </span>
              </Alert>
            )}

            {!isRebooting && successMessage && (
              <Alert variant="secondary">
                <span className="text-success">
                  <FontAwesomeIcon icon={faCheck} className="fa-fw mr-1" />
                </span>
                {successMessage}
              </Alert>
            )}

            {isFormShowing && (
              <Alert variant="secondary">
                <h5>Firmware Update</h5>
                <Form className="mt-3" onSubmit={onFirmwareSubmit}>
                  <Form.Group>
                    <input ref={firmwareFile} name="file" type="file"></input>
                  </Form.Group>

                  <Button type="submit" variant="primary">
                    Submit
                  </Button>
                </Form>
              </Alert>
            )}

            <div className="d-flex">
              <Button
                className="mr-2"
                disabled={isRebooting}
                variant="primary"
                onClick={toggleFormShowing}
              >
                <FontAwesomeIcon icon={faRedoAlt} className="fa-fw mr-1" />
                Update Firmware
              </Button>

              <Button disabled={isRebooting} variant="warning" onClick={reboot}>
                <FontAwesomeIcon icon={faPowerOff} className="fa-fw mr-1" />
                Reboot
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default props => {
  const [settings, setSettings] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    api.get("/settings").then(e => setSettings(e.data));
  }, []);

  useEffect(() => {
    api.get("/system").then(e => setSystemStatus(e.data));
  }, []);

  return (
    <Container className="dashboard">
      <Row>
        <Col sm={5}>
          <DisplayStatusCard settings={settings} />
        </Col>
        <Col sm={5}>
          <SystemStatusCard systemStatus={systemStatus} />
        </Col>
      </Row>
    </Container>
  );
};
