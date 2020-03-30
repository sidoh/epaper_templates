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
  faCheck,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { useInterval, useBoolean } from "react-use";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";
import { useMemo } from "react";

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

const SleepStatus = ({
  deepSleepActive,
  awakeSecondsLeft,
  isCancelling,
  onCancel,
  isRebooting
}) => {
  return (
    <>
      {!isRebooting && deepSleepActive && awakeSecondsLeft !== null && (
        <>
          <h6>Deep Sleep</h6>
          {awakeSecondsLeft > 0 && (
            <>
              <Container fluid className="p-0 m-0">
                <Row>
                  <Col lg={8} md={12}>
                    System sleeping in {awakeSecondsLeft} seconds
                  </Col>
                  <Col lg={4} md={12}>
                    {!isCancelling && (
                      <a href="#" onClick={onCancel} className="text-success">
                        <MemoizedFontAwesomeIcon
                          icon={faTimes}
                          className="fa-fw"
                        />
                        Cancel
                      </a>
                    )}
                    {isCancelling && "Cancelling..."}
                  </Col>
                </Row>
              </Container>
            </>
          )}
          {awakeSecondsLeft !== null && awakeSecondsLeft <= 0 && (
            <span>Going to sleep...</span>
          )}
        </>
      )}
    </>
  );
};

const SystemStatusCard = ({ settings, systemStatus, onReload }) => {
  const [isRebooting, setRebooting] = useState(false);
  const [isFormShowing, toggleFormShowing] = useBoolean(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [awakeSecondsLeft, setAwakeSecondsLeft] = useState(null);
  const [isCancellingDeepSleep, setCancellingDeepSleep] = useState(false);

  const firmwareFile = useRef(null);
  const deepSleepActive = systemStatus && systemStatus["deep_sleep_active"];

  const onCancelSleep = useCallback(e => {
    e.preventDefault();
    setCancellingDeepSleep(true);

    api.post("/system", { command: "cancel_sleep" }).then(
      e => {
        onReload();
      },
      e => {
        setCancellingDeepSleep(false);
      }
    );
  }, []);

  useInterval(
    () => {
      api
        .get("/system", { timeout: 1000 })
        .then(() => {
          onReload();
          setRebooting(false)
        })
        .catch(e => console.log("Caught exception", e));
    },
    !!isRebooting ? 5000 : null
  );

  useInterval(
    () => {
      const awakeDuration = settings["power.awake_duration"];
      const uptime = systemStatus["uptime"];
      const loadedAt = systemStatus.__loaded_at;
      const currentTime = new Date();

      if (deepSleepActive) {
        const awakeSeconds = Math.round(
          (awakeDuration * 1000 - uptime - (currentTime - loadedAt)) / 1000
        );
        setAwakeSecondsLeft(awakeSeconds);

        if (awakeSeconds <= 0) {
          setRebooting("Sleeping...");
        }
      }
    },
    deepSleepActive ? 100 : null
  );

  const reboot = useCallback(e => {
    e.preventDefault();

    if (confirm("Are you sure you want to reboot?")) {
      setRebooting("Rebooting...");
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
        setRebooting(false);
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

            <SleepStatus
              deepSleepActive={deepSleepActive}
              awakeSecondsLeft={awakeSecondsLeft}
              isCancelling={isCancellingDeepSleep}
              onCancel={onCancelSleep}
              isRebooting={!!isRebooting}
            />

            {isRebooting && (
              <Alert variant="secondary" className="d-flex">
                <SiteLoader size="sm" />
                <span className="ml-2 text-bold">
                  <b>{isRebooting}</b>
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
                  <MemoizedFontAwesomeIcon
                    icon={faCheck}
                    className="fa-fw mr-1"
                  />
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

            <hr className="bg-light" />

            <div className="d-flex">
              <Button
                className="mr-2"
                disabled={!!isRebooting}
                variant="primary"
                onClick={toggleFormShowing}
              >
                <MemoizedFontAwesomeIcon
                  icon={faRedoAlt}
                  className="fa-fw mr-1"
                />
                Update Firmware
              </Button>

              <Button disabled={!!isRebooting} variant="warning" onClick={reboot}>
                <MemoizedFontAwesomeIcon
                  icon={faPowerOff}
                  className="fa-fw mr-1"
                />
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
  const [loadedAt, setLoadedAt] = useState(new Date());

  const onReload = useCallback(() => {
    setLoadedAt(new Date());
  }, []);

  useEffect(() => {
    api.get("/settings").then(e => setSettings(e.data));
  }, [loadedAt]);

  useEffect(() => {
    api.get("/system").then(e =>
      setSystemStatus({
        __loaded_at: loadedAt,
        ...e.data
      })
    );
  }, [loadedAt]);

  return (
    <Container className="dashboard">
      <Row>
        <Col sm={5}>
          <DisplayStatusCard settings={settings} />
        </Col>
        <Col sm={5}>
          <SystemStatusCard
            settings={settings}
            systemStatus={systemStatus}
            onReload={onReload}
          />
        </Col>
      </Row>
    </Container>
  );
};
