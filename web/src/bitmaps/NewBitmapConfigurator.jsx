import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useCallback, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import "./NewBitmapConfigurator.scss";
import MemoizedFontAwesomeIcon from "../util/MemoizedFontAwesomeIcon";

const LabelWithError = ({ label, error }) => {
  return (
    <Form.Label className={error ? "error" : ""}>
      {label}
      {error && <span className="error-message">{error}</span>}
    </Form.Label>
  );
};

export default ({ onSave }) => {
  const [filename, setFilename] = useState("");
  const [width, setWidth] = useState(64);
  const [height, setHeight] = useState(64);
  const [errors, setErrors] = useState({});

  const _onSave = useCallback(
    e => {
      e.preventDefault();
      const newErrors = {};

      if (!filename.match(/^[a-zA-Z0-9-._]+$/)) {
        newErrors.filename =
          "must be non-empty, and contain only a-z, 0-9, -, _, .";
      }
      if (width == 0) {
        newErrors.dimensions = "must be > 0";
      }
      if (height == 0) {
        newErrors.dimensions = "must be > 0";
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        return;
      } else {
        onSave({ filename, width, height });
      }
    },
    [onSave, filename, width, height]
  );

  return (
    <>
      <Form onSubmit={_onSave} className="new-bitmap">
        <h3>New Bitmap</h3>
        <hr />

        <Form.Group>
          <LabelWithError label="Name" error={errors.filename} />
          <Form.Control
            value={filename}
            onChange={e => setFilename(e.target.value)}
            placeholder="my-cool-bitmap.bin"
          />
        </Form.Group>

        <Form.Group>
          <LabelWithError label="Dimensions" error={errors.dimensions} />

          <div className="dimensions-inputs d-flex">
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>Width</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                type="number"
                value={width}
                onChange={e => setWidth(e.target.value)}
              />
            </InputGroup>

            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>Height</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
              />
            </InputGroup>
          </div>
        </Form.Group>

        <Form.Group>
          <div className="d-flex mt-4">
            <div className="mr-auto" />
            <Button type="submit" variant="primary">
              <MemoizedFontAwesomeIcon icon={faPlusCircle} className="fa-fw mr-1" />
              Create Bitmap
            </Button>
          </div>
        </Form.Group>
      </Form>
    </>
  );
};
