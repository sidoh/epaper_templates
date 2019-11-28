import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef
} from "react";
import { binToDataUrl } from "../bitmaps/BitmapCanvas";
import useGlobalState from "../state/global_state";
import "./SvgCanvas.scss";
import { MarkedForDeletion, FieldTypeDefinitions } from "./schema";

function SvgLine({
  definition: { x1 = 0, y1 = 0, x2 = 0, y2 = 0, color = "black" },
  isActive,
  onClick,
  className
}) {
  const style = useMemo(
    () => ({
      stroke: color
    }),
    [color]
  );

  return (
    <line
      className={className}
      {...{ x1, y1, x2, y2 }}
      className={isActive ? "active" : ""}
      onClick={onClick}
      style={style}
    />
  );
}

function SvgText({
  definition: { x = 0, y = 0, value: valueDef = {}, color = "black" },
  onClick,
  isActive,
  resolvedValue,
  className
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
      className={className}
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
function SvgRectangle({
  definition,
  definition: {
    x = 0,
    y = 0,
    style,
    color,
    w: widthDef = {},
    h: heightDef = {}
  },
  onClick,
  isActive,
  resolvedValue,
  className
}) {
  const [width, height] = useMemo(() => {
    const extract = key => {
      const def = definition[key];

      if (!def) {
        return 0;
      }

      if (def.type === "static") {
        return def.value || 0;
      } else if (def.variable) {
        return resolvedValue;
      } else {
        return 0;
      }
    };

    return [extract("w"), extract("h")];
  }, [resolvedValue, widthDef, heightDef]);

  const classes = useMemo(() => {
    return [className, style === "filled" ? "filled" : "outline"];
  }, [style, className]);

  return (
    <rect {...{ x, y, width, height }} className={classes.join(" ")} onClick={onClick} />
  );
}

function SvgBitmap({
  definition: { x = 0, y = 0, w: width = 0, h: height = 0 },
  _static,
  resolvedValue,
  isActive,
  onClick,
  className
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
    <>
      <image
        className={className}
        {...{ x, y, width, height }}
        onClick={onClick}
        xlinkHref={src}
      />
      <rect
        {...{ x: x - 2, y: y - 2, width: width + 4, height: height + 4 }}
        className="image-outline"
      />
    </>
  );
}

const SvgElementsByType = {
  lines: SvgLine,
  text: SvgText,
  bitmaps: SvgBitmap,
  rectangles: SvgRectangle
};

const WrappedSvgElement = ({
  toggleActiveElement,
  isActive,
  type,
  id,
  onUpdateActive,
  isDragging,
  ...rest
}) => {
  const onClick = useCallback(() => {
    if (!rest.definition.__drag || !rest.definition.__drag.moved) {
      toggleActiveElement(type, id);
    }
  }, [rest.definition, toggleActiveElement, type, id]);
  const Element = SvgElementsByType[type];

  if (!Element) {
    console.warn("Invalid element type: ", type, ".  Skipping.");
    return <></>;
  }

  return (
    <Element
      {...rest}
      isActive={isActive}
      onClick={onClick}
      className={isActive ? "active" : ""}
    />
  );
};

export function SvgCanvas({
  width,
  height,
  definition,
  resolvedVariables,
  activeElements,
  toggleActiveElement,
  onUpdateActive,
  markForCollapse,
  collapse
}) {
  const isDragging = useRef(null);

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

  const eventListeners = useMemo(
    () => ({
      onMouseDown: e => {
        if (e.target.classList.contains("active")) {
          isDragging.current = true;
          onUpdateActive(defn => {
            const keys = Object.keys(defn);
            const exFields = prefix =>
              keys.filter(x => x.startsWith(prefix)).map(x => [x, defn[x]]);

            defn.__drag = {
              start: {
                x: exFields("x"),
                y: exFields("y")
              },
              cursor: { x: e.pageX, y: e.pageY }
            };

            markForCollapse();
          });
        }
      },
      onClick: e => {
        if (isDragging.current) {
          onUpdateActive(defn => {
            delete defn.__drag;
          });
        }
        collapse();
        isDragging.current = false;
      },
      onMouseLeave: e => {
        onUpdateActive(defn => {
          delete defn.__drag;
        });
        collapse();
        isDragging.current = false;
      },
      onMouseMove: e => {
        if (isDragging.current) {
          onUpdateActive(dfn => {
            const ctx = dfn.__drag;

            ctx.moved = true;

            ctx.start.x.forEach(([field, start]) => {
              dfn[field] = start + (e.pageX - ctx.cursor.x);
            });
            ctx.start.y.forEach(([field, start]) => {
              dfn[field] = start + (e.pageY - ctx.cursor.y);
            });
          });
        }
      }
    }),
    [onUpdateActive]
  );

  return (
    <svg {...eventListeners} width={width} height={height} style={svgStyle}>
      {Object.keys(FieldTypeDefinitions)
        .flatMap(type =>
          (definition[type] || []).map((x, i) => {
            const resolvedValue =
              resolvedVariables[type] && resolvedVariables[type][i];

            return (
              <WrappedSvgElement
                isDragging={isDragging.current}
                onUpdateActive={onUpdateActive}
                toggleActiveElement={toggleActiveElement}
                resolvedValue={resolvedValue}
                key={`${type}-${i}`}
                isActive={isRegionActive(type, i)}
                definition={x}
                type={type}
                id={i}
              />
            );
          })
        )
        .filter(x => x)}
    </svg>
  );
}
