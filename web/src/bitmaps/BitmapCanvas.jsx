import React, { useCallback, useEffect, useRef } from "react";
import SiteLoader from "../util/SiteLoader";

const drawPixel = ({ ctx, color, x, y, pixelDimension }) => {
  const pixelX = x * pixelDimension;
  const pixelY = y * pixelDimension;
  ctx.fillStyle = color;
  ctx.fillRect(pixelX + 1, pixelY + 1, pixelDimension - 1, pixelDimension - 1);
};

const createCanvas = (width, height) => {
  const cvs = document.createElement("canvas");
  cvs.setAttribute("width", width);
  cvs.setAttribute("height", height);

  return cvs;
};

const resizeBitmap = ({ bitmap, width, height, newWidth, newHeight, sensitivity = 0.6 }) => {
  const buffer = new Uint8Array(newWidth * newHeight);
  const oldCvs = createCanvas(width, height);
  const newCvs = createCanvas(newWidth, newHeight);

  const oldCvsContext = oldCvs.getContext("2d");
  const newCvsContext = newCvs.getContext("2d");

  redraw({
    ctx: oldCvsContext,
    bitmap,
    color: "rgb(0,0,0)",
    backgroundColor: "rgb(255,255,255)",
    width,
    height,
    pixelDimension: 1
  });

  newCvsContext.drawImage(oldCvs, 0, 0, newWidth, newHeight);

  for (let y = 0; y < newHeight; ++y) {
    for (let x = 0; x < newWidth; ++x) {
      const [r, g, b] = newCvsContext.getImageData(x, y, 1, 1).data;
      const bit = ((r + g + b) / (3*255)) < sensitivity ? 1 : 0;

      buffer[y * newWidth + x] = bit;
    }
  }

  return buffer;
};

const redraw = ({
  ctx,
  bitmap,
  color,
  backgroundColor,
  width,
  height,
  pixelDimension
}) => {
  const mw = width * pixelDimension;
  const mh = height * pixelDimension;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, mw, mh);

  let x = 0;
  let y = 0;
  ctx.fillStyle = color;

  for (let i = 0; i < bitmap.length; ++i) {
    if (bitmap[i]) {
      ctx.fillRect(x, y, pixelDimension, pixelDimension);
    }

    x += pixelDimension;
    y += Math.floor(x / mw) * pixelDimension;
    x %= mw;
  }
};

const redrawGrid = ({ ctx, color, width, height, pixelDimension }) => {
  const mw = width * pixelDimension;
  const mh = height * pixelDimension;

  ctx.fillStyle = color;

  for (let x = pixelDimension; x < mw; x += pixelDimension) {
    ctx.fillRect(x, 0, 1, mh);
  }

  for (let y = pixelDimension; y < mh; y += pixelDimension) {
    ctx.fillRect(0, y, mw, 1);
  }
};

const bitmapFromBin = binData => {
  const bitmapBytes = new Uint8Array(binData);
  const bitmap = bitmapBytes.reduce((bits, x) => {
    for (let i = 0; i < 8; ++i) {
      bits.push((x >> (7 - i)) & 1);
    }
    return bits;
  }, []);

  return bitmap;
};

const floodFill = (bitmap, value, x, y, w, h) => {
  const bitmapCopy = [...bitmap];

  const _floodFill = (_x, _y) => {
    if (_x >= w || _x < 0 || _y > h || _y < 0) {
      return;
    }

    const ix = _y * w + _x;
    if (bitmapCopy[ix] != value) {
      bitmapCopy[ix] = value;
      _floodFill(_x, _y - 1);
      _floodFill(_x, _y + 1);
      _floodFill(_x - 1, _y);
      _floodFill(_x + 1, _y);
    }
  };

  _floodFill(x, y);

  return bitmapCopy;
};

const binFromBitmap = bitmap => {
  const bitmapBytes = new Uint8Array(bitmap.length / 8);

  for (let i = 0; i < bitmap.length; i += 8) {
    let v = 0;

    for (let x = 0; x < 8; x++) {
      v |= bitmap[i + x] << (7 - x);
    }

    bitmapBytes[i / 8] = v;
  }

  return bitmapBytes;
};

export {
  redraw,
  redrawGrid,
  bitmapFromBin,
  binFromBitmap,
  floodFill,
  resizeBitmap,
  drawPixel
};

export default ({
  data,
  bitmap,
  canvasRef = () => {},
  drawGrid = false,
  scaleFactor = 10,
  width,
  height,
  backgroundColor = "rgb(255,255,255)",
  color = "rgba(0,0,0)",
  gridColor = "rgba(220,220,220)",
  className
}) => {
  const canvas = useRef(null);
  const mw = width * scaleFactor;
  const mh = height * scaleFactor;

  if (data && !bitmap) {
    bitmap = bitmapFromBin(data);
  }

  const drawCanvas = () => {
    if (canvas.current && data) {
      const ctx = canvas.current.getContext("2d");

      redraw({
        ctx,
        bitmap,
        color,
        backgroundColor,
        width,
        height,
        pixelDimension: scaleFactor
      });

      if (drawGrid) {
        redrawGrid({
          ctx,
          color: gridColor,
          width,
          height,
          pixelDimension: scaleFactor
        });
      }

      canvasRef(canvas.current, bitmap);
    }
  };

  useEffect(drawCanvas, [data, bitmap, mw, mh]);

  const canvasCallbackRef = useCallback(x => {
    canvas.current = x;
    drawCanvas();
  }, []);

  return (
    <>
      {data == null && <SiteLoader size="sm" />}
      {data != null && (
        <canvas
          className={className}
          ref={canvasCallbackRef}
          width={mw}
          height={mh}
        />
      )}
    </>
  );
};