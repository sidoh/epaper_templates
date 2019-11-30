import React, { useCallback, useRef, useEffect, useState } from "react";
import BitmapCanvas, {
  bitmapFromBin,
  redraw,
  redrawGrid,
  drawPixel,
  binFromBitmap,
  floodFill,
  resizeBitmap
} from "./BitmapCanvas";
import { useList, usePrevious, useToggle } from "react-use";
import BitmapToolbar from "./BitmapToolbar";
import { faArrowCircleRight } from "@fortawesome/free-solid-svg-icons";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

import "./BitmapEditor.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDropzone } from "react-dropzone";
import ReactSlider from "react-slider";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useUndoableList } from "../util/use-undo-reducer";

const FileType = Object.freeze({
  IMAGE: "image",
  BITMAP: "bitmap"
});

const ImageImporter = ({ onImportImage, onImportBitmap }) => {
  const previewImage = useRef(null);
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(FileType.IMAGE);
  const [metadata, setMetadata] = useState({});
  const [sensitivity, setSensitivity] = useState(20);
  const [bitmapData, setBitmapData] = useState(null);

  const onChange = useCallback(e => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }, []);

  const onImportClick = useCallback(
    e => {
      if (fileType == FileType.IMAGE) {
        onImportImage(previewImage.current, sensitivity / 100);
      } else {
        onImportBitmap(bitmapData, metadata.width, metadata.height);
      }
    },
    [onImportImage, file, fileType, bitmapData, metadata, sensitivity]
  );

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    if (previewImage.current && file) {
      if (file.name.endsWith("bin")) {
        const reader = new FileReader();
        reader.onload = e => {
          const data = e.target.result;
          const bitLength = data.byteLength * 8;

          setBitmapData(data);
          setMetadata({
            width: Math.floor(Math.sqrt(bitLength)),
            height: Math.ceil(Math.sqrt(bitLength))
          });
          setFileType(FileType.BITMAP);
        };
        reader.readAsArrayBuffer(file);
      } else {
        previewImage.current.onload = () => {
          const img = previewImage.current;
          setMetadata({
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        };
        previewImage.current.src = URL.createObjectURL(file);
        setFileType(FileType.IMAGE);
      }
    }
  }, [file]);

  return (
    <>
      <div className="flex-grow-1 image-importer">
        <div className="mb-2">
          <div className="drop-zone" {...getRootProps()}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drop file here, or click for a browser.</p>
            )}
          </div>
        </div>
        <div className="mb-2 image-preview d-flex">
          {fileType === FileType.IMAGE && (
            <img
              className={metadata.width ? "has-image" : ""}
              ref={previewImage}
            />
          )}

          {fileType == FileType.BITMAP && bitmapData && (
            <BitmapCanvas
              data={bitmapData}
              width={metadata.width}
              height={metadata.height}
            />
          )}

          {metadata.width != null && (
            <div className="metadata">
              {fileType == FileType.BITMAP && "Calculated "}
              Dimensions: {metadata.width}x{metadata.height}
            </div>
          )}
        </div>
        {file != null && (
          <>
            {fileType == FileType.IMAGE && (
              <>
                <h6>Sensitivity</h6>
                <ReactSlider
                  value={sensitivity}
                  min={0}
                  max={100}
                  onChange={setSensitivity}
                />
              </>
            )}

            {fileType == FileType.BITMAP && (
              <>
                <Form.Group className="d-flex">
                  <InputGroup className="mr-2">
                    <InputGroup.Prepend>
                      <InputGroup.Text>Width</InputGroup.Text>
                    </InputGroup.Prepend>
                    <Form.Control
                      type="number"
                      value={metadata.width}
                      onChange={e =>
                        setMetadata({ ...metadata, width: e.target.value })
                      }
                    />
                  </InputGroup>

                  <InputGroup>
                    <InputGroup.Prepend>
                      <InputGroup.Text>Height</InputGroup.Text>
                    </InputGroup.Prepend>
                    <Form.Control
                      type="number"
                      value={metadata.height}
                      onChange={e =>
                        setMetadata({ ...metadata, height: e.target.value })
                      }
                    />
                  </InputGroup>
                </Form.Group>
              </>
            )}

            <Button onClick={onImportClick}>
              <FontAwesomeIcon
                icon={faArrowCircleRight}
                className="fa-fw mr-1"
              />
              Import
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default ({
  bitmapDefinition,
  initialData,
  isSaving,
  onSave,
  onDelete,
  scaleFactor = 10
}) => {
  const {
    metadata: { height: initialHeight = 64, width: initialWidth = 64 } = {}
  } = bitmapDefinition;

  // const [bitmap, { set: setBitmap, updateAt: setBitmapBit }] = useList();
  const [
    bitmap,
    { markForCollapse, collapse, undo, redo, canUndo, canRedo, set: setBitmap, updateAt: setBitmapBit }
  ] = useUndoableList();

  const [cursorPosition, setCursorPosition] = useState(null);
  const previousCursorPosition = usePrevious(cursorPosition);

  const [data, setData] = useState(null);
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [isDrawing, setDrawing] = useState(false);
  const canvas = useRef(null);

  const [isLoaderActive, toggleLoaderActive] = useToggle(false);
  const [activeTool, setActiveTool] = useState("pencil");
  const [color, setColor] = useState(1);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const canvasCallback = useCallback(cvs => {
    canvas.current = cvs;
  });

  const setBitmapPixel = useCallback(
    (x, y, value, { force = false } = {}) => {
      if (isDrawing || force) {
        setBitmapBit(y * width + x, value);
      }
    },
    [isDrawing, width, height, setBitmapBit]
  );

  const getBitmapPixelColor = useCallback(
    ({
      x,
      y,
      onColor = "rgb(0,0,0)",
      offColor = "rgb(255,255,255)",
      invert = false
    }) => {
      return bitmap[y * width + x] == (invert ? 0 : 1) ? onColor : offColor;
    },
    [width, height, bitmap]
  );

  const onResize = useCallback(
    ({ width: newWidth, height: newHeight }) => {
      const newBitmap = resizeBitmap({
        bitmap,
        width,
        height,
        newWidth,
        newHeight
      });

      setWidth(newWidth);
      setHeight(newHeight);
      setData(binFromBitmap(newBitmap));
    },
    [width, height, bitmap]
  );

  const onDownload = useCallback(() => {
    const data = binFromBitmap(bitmap);
    const blob = new Blob([data], { type: "application/octet-stream" });
    const link = document.createElement("a");

    link.href = window.URL.createObjectURL(blob);
    link.download = bitmapDefinition.filename;
    link.click();
  }, [bitmap, bitmapDefinition]);

  const _onSave = useCallback(() => {
    const bin = binFromBitmap(bitmap);
    onSave(bin, { width, height });
  }, [onSave, bitmap]);

  const importBitmap = useCallback((newBitmap, width, height) => {
    setData(newBitmap);
    setWidth(width);
    setHeight(height);
  }, []);

  const importImage = useCallback(
    (image, sensitivity) => {
      const imgCopy = new Image(width, height);

      imgCopy.onload = () => {
        const canvasCopy = document.createElement("canvas");
        const ctx = canvasCopy.getContext("2d");
        const newBitmap = [];
        ctx.drawImage(imgCopy, 0, 0, width, height);
        let i = 0;

        for (let x = 0; x < width; ++x) {
          for (let y = 0; y < height; ++y) {
            const [r, g, b, a] = ctx.getImageData(y, x, 1, 1).data;

            const blackDistance =
              [r, g, b].reduce((r, x) => r + (255 - a) + (a / 255) * x, 0) /
              (3 * 255);

            newBitmap[i++] = blackDistance < sensitivity ? 1 : 0;
          }
        }

        setBitmap(newBitmap);
      };

      imgCopy.src = image.src;
    },
    [bitmapDefinition, width, height]
  );

  useEffect(() => {
    const expectedLen = width * height;
    let bt = bitmapFromBin(data);

    if (bt.length < expectedLen) {
      bt = [...bt, ...Array(expectedLen - bt.length).fill(0)];
    }

    setBitmap(bt);
  }, [data, width, height]);

  const redrawCanvas = useCallback(() => {
    if (canvas.current) {
      const ctx = canvas.current.getContext("2d");

      redraw({
        ctx,
        bitmap,
        color: "rgb(0,0,0)",
        backgroundColor: "rgb(255,255,255)",
        width,
        height,
        pixelDimension: scaleFactor
      });

      redrawGrid({
        ctx,
        color: "rgb(230,230,230)",
        width,
        height,
        pixelDimension: scaleFactor
      });
    }
  }, [bitmap]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, bitmap]);

  useEffect(() => {
    if (canvas.current) {
      const ctx = canvas.current.getContext("2d");

      if (cursorPosition) {
        drawPixel({
          ctx,
          color: "rgb(150, 150, 150)",
          x: cursorPosition.x,
          y: cursorPosition.y,
          pixelDimension: scaleFactor
        });
      }

      if (
        previousCursorPosition != null &&
        (cursorPosition == null ||
          previousCursorPosition.x != cursorPosition.x ||
          previousCursorPosition.y != cursorPosition.y)
      ) {
        drawPixel({
          ctx,
          color: getBitmapPixelColor(previousCursorPosition),
          x: previousCursorPosition.x,
          y: previousCursorPosition.y,
          pixelDimension: scaleFactor
        });
      }
    }
  }, [
    cursorPosition,
    getBitmapPixelColor,
    previousCursorPosition,
    scaleFactor
  ]);

  useEffect(() => {
    const cvs = canvas.current;

    if (!cvs) {
      return;
    }

    const getCanvasPosition = e => {
      const rect = canvas.current.getBoundingClientRect();
      const scaleX = cvs.width / rect.width;
      const scaleY = cvs.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      return {
        x,
        y,
        pixelX: Math.floor(x / scaleFactor),
        pixelY: Math.floor(y / scaleFactor)
      };
    };

    cvs.onmousemove = e => {
      const { pixelX, pixelY } = getCanvasPosition(e);

      if (
        !cursorPosition ||
        cursorPosition.x != pixelX ||
        cursorPosition.y != pixelY
      ) {
        setCursorPosition({ x: pixelX, y: pixelY });
      }

      if (activeTool == "pencil" && e.buttons & 1) {
        setBitmapPixel(pixelX, pixelY, color);
      }
    };

    cvs.onmouseout = () => {
      setDrawing(false);
      setCursorPosition(null);
      collapse();
    };

    cvs.onmousedown = e => {
      setDrawing(true);
      markForCollapse();
    };

    cvs.onclick = (e) => {
      const { pixelX, pixelY } = getCanvasPosition(e);
      setBitmapPixel(pixelX, pixelY, color, { force: true });
    }

    cvs.onmouseup = (e) => {
      const { pixelX, pixelY } = getCanvasPosition(e);

      if (activeTool == "pencil") {
        setBitmapPixel(pixelX, pixelY, color);
      } else if (activeTool == "fill") {
        const updatedBitmap = floodFill(
          bitmap,
          color,
          pixelX,
          pixelY,
          width,
          height
        );
        setBitmap(updatedBitmap);
      }

      setDrawing(false);
      collapse();
    }
  }, [
    redrawCanvas,
    bitmap,
    activeTool,
    color,
    cursorPosition,
    width,
    height,
    scaleFactor
  ]);

  return (
    <>
      <BitmapToolbar
        width={width}
        height={height}
        bitmapDefinition={bitmapDefinition}
        onResize={onResize}
        onDownload={onDownload}
        onChangeTool={setActiveTool}
        activeTool={activeTool}
        isLoaderActive={isLoaderActive}
        toggleLoaderActive={toggleLoaderActive}
        onSave={_onSave}
        color={color}
        setColor={setColor}
        onDelete={onDelete}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <Container>
        <Row>
          <Col sm={isLoaderActive ? 4 : 0}>
            {isLoaderActive && (
              <ImageImporter
                onImportBitmap={importBitmap}
                onImportImage={importImage}
              />
            )}
          </Col>
          <Col sm={isLoaderActive ? 8 : 12}>
            <div className="d-flex justify-content-center">
              <BitmapCanvas
                className="image-editor"
                drawGrid={true}
                canvasRef={canvasCallback}
                bitmap={bitmap}
                data={data}
                width={width}
                height={height}
                scaleFactor={scaleFactor}
              />
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};
