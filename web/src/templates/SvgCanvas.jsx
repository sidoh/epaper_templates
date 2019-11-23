import React, { useCallback, useEffect, useMemo, useState } from "react";
import { binToDataUrl } from "../bitmaps/BitmapCanvas";
import useGlobalState from "../state/global_state";
import "./SvgCanvas.scss";

function SvgLine({ x1, y1, x2, y2, isActive, onClick, color = "black" }) {
  const style = useMemo(
    () => ({
      stroke: color
    }),
    [color]
  );

  return (
    <line
      {...{ x1, y1, x2, y2 }}
      className={isActive ? "active" : ""}
      onClick={onClick}
      style={style}
    />
  );
}

function SvgText({
  x,
  y,
  onClick,
  isActive,
  value: valueDef = {},
  resolvedValue,
  color = "black"
}) {
  const style = useMemo(
    () => ({
      fill: color
    }),
    [color, isActive]
  );

  const text = useMemo(() => {
    if (valueDef.type == "static") {
      return valueDef.value;
    }

    return resolvedValue || "<$>";
  }, [valueDef, resolvedValue]);

  return (
    <text
      x={x}
      y={y}
      style={style}
      className={isActive ? "active" : ""}
      onClick={onClick}
    >
      {text}
    </text>
  );
}

function SvgBitmap({
  x,
  y,
  w: width,
  h: height,
  _static,
  resolvedValue,
  isActive,
  onClick
}) {
  const [globalState, globalActions] = useGlobalState();
  const [src, setSrc] = useState(null);

  useEffect(() => {
    const file = _static || resolvedValue;

    if (file) {
      globalActions.loadBitmap(file).then(x => {
        setSrc(
          binToDataUrl({
            binData: x,
            width,
            height,
            color: isActive ? "rgb(200,200,100)" : "rgb(0,0,0)"
          })
        );
      });
    }
  }, [_static, resolvedValue, isActive]);

  return (
    <image
      {...{ x, y, width, height }}
      className={isActive ? "active" : ""}
      onClick={onClick}
      xlinkHref={src}
    />
  );
}

export function SvgCanvas({
  width,
  height,
  definition,
  resolvedVariables,
  activeElements,
  toggleActiveElement
}) {
  const svgStyle = useMemo(
    () => ({
      backgroundColor: definition.background_color
    }),
    [definition.background_color]
  );

  const isRegionActive = useCallback(
    (regionType, index) =>
      activeElements.some(x => x[0] == regionType && x[1] == index),
    [activeElements]
  );

  return (
    <svg width={width} height={height} style={svgStyle}>
      {(definition.lines || []).map((x, i) => (
        <SvgLine
          onClick={() => toggleActiveElement("lines", i)}
          isActive={isRegionActive("lines", i)}
          key={`line-${i}`}
          {...x}
        />
      ))}

      {(definition.text || []).map((x, i) => {
        const resolvedValue = resolvedVariables.text[i];
        return (
          <SvgText
            onClick={() => toggleActiveElement("text", i)}
            isActive={isRegionActive("text", i)}
            key={`text-${i}`}
            resolvedValue={resolvedValue}
            {...x}
          />
        );
      })}

      {(definition.bitmaps || []).map((x, i) => {
        const resolvedValue = resolvedVariables.bitmaps[i];
        return (
          <SvgBitmap
            isActive={isRegionActive("bitmaps", i)}
            onClick={() => toggleActiveElement("bitmaps", i)}
            key={`bitmap-${i}`}
            resolvedValue={resolvedValue}
            {...x}
          />
        );
      })}
    </svg>
  );
}
