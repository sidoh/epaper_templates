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
import {
  FieldTypeDefinitions,
  FontDefinitions,
  getFontDefinition
} from "./schema";
import { original } from "immer";

const SvgLine = React.memo(
  React.forwardRef((props, ref) => {
    const {
      definition: { x1 = 0, y1 = 0, x2 = 0, y2 = 0, color = "black" },
      isActive,
      onClick,
      className
    } = props;

    const style = useMemo(
      () => ({
        stroke: color
      }),
      [color]
    );

    return (
      <line
        ref={ref}
        className={className}
        {...{ x1, y1, x2, y2 }}
        className={isActive ? "active" : ""}
        onClick={onClick}
        style={style}
      />
    );
  })
);

const SvgText = React.memo(
  React.forwardRef((props, ref) => {
    const {
      definition,
      definition: { x = 0, y = 0, value: valueDef = {}, color = "black" },
      onClick,
      isActive,
      resolvedValue,
      className
    } = props;
    const style = useMemo(() => {
      const fontStyle = getFontDefinition(definition.font).style;
      return {
        fill: color,
        ...fontStyle,
        fontSize: `${fontStyle.fontSize * (definition.font_size || 1)}pt`
      };
    }, [definition, isActive]);

    const text = useMemo(() => {
      if (valueDef.type == "static") {
        return valueDef.value;
      }

      return resolvedValue || "<$>";
    }, [valueDef, resolvedValue]);

    return (
      <text
        ref={ref}
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
  })
);

const SvgRectangle = React.memo(
  React.forwardRef((props, ref) => {
    const {
      definition,
      definition: {
        x = 0,
        y = 0,
        style,
        color = "black",
        w: widthDef = {},
        h: heightDef = {}
      },
      onClick,
      isActive,
      resolvedValue,
      className
    } = props;

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
      <rect
        ref={ref}
        {...{ x, y, width, height }}
        stroke={color}
        className={classes.join(" ")}
        onClick={onClick}
      />
    );
  })
);

const SvgBitmap = React.memo(
  React.forwardRef((props, ref) => {
    const {
      definition: {
        x = 0,
        y = 0,
        w: width = 0,
        h: height = 0,
        color = "black"
      },
      _static,
      resolvedValue,
      isActive,
      onClick,
      className
    } = props;
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
              color
            })
          );
        });
      }
    }, [_static, resolvedValue, color]);

    return (
      <>
        <image
          ref={ref}
          className={className}
          {...{ x, y, width, height }}
          onClick={onClick}
          xlinkHref={src}
        />
      </>
    );
  })
);

const SvgElementsByType = {
  lines: SvgLine,
  text: SvgText,
  bitmaps: SvgBitmap,
  rectangles: SvgRectangle
};

const intervalOverlaps = (s1, s2, t1, t2) => {
  return (
    (s1 >= t1 && s1 <= t2) || (s2 >= t1 && s2 <= t2) || (s1 <= t1 && s2 >= t2)
  );
};

const rectOverlaps = (r1, r2) => {
  return (
    intervalOverlaps(r1.x, r1.x + r1.width, r2.x, r2.x + r2.width) &&
    intervalOverlaps(r1.y, r1.y + r1.height, r2.y, r2.y + r2.height)
  );
};

const WrappedSvgElement = props => {
  const {
    toggleActiveElement,
    selectionBox,
    elementRef,
    isActive,
    type,
    id,
    onUpdateActive,
    isDragging,
    outlineOffset = 3,
    ...rest
  } = props;
  const _elementRef = useRef();
  const [boundingBoxProps, setBoundingBoxProps] = useState(null);

  const onClick = useCallback(
    e => {
      e.stopPropagation();
      if (!rest.definition.__drag || !rest.definition.__drag.moved) {
        toggleActiveElement(type, id);
      }
    },
    [rest.definition, toggleActiveElement, type, id]
  );

  const refCallback = useCallback(
    e => {
      _elementRef.current = e;
      elementRef(type, id, e);
    },
    [type, id, elementRef]
  );

  const Element = SvgElementsByType[type];

  if (!Element) {
    console.warn("Invalid element type: ", type, ".  Skipping.");
    return <></>;
  }

  useEffect(() => {
    if (_elementRef.current && isActive) {
      const { x, y, width, height } = _elementRef.current.getBBox();
      setBoundingBoxProps({
        x: x - outlineOffset,
        y: y - outlineOffset,
        width: width + outlineOffset * 2,
        height: height + outlineOffset * 2
      });
    } else {
      setBoundingBoxProps(null);
    }
  }, [isActive, _elementRef.current, outlineOffset, props.definition]);

  return (
    <>
      <Element
        {...rest}
        ref={refCallback}
        isActive={isActive}
        onClick={onClick}
        className={isActive ? "active" : ""}
      />

      {boundingBoxProps && <rect {...boundingBoxProps} className="selection-outline" />}
    </>
  );
};

const SvgCursorIndicator = ({ x, y, size = 10 }) => {
  const onClick = useCallback(e => {
    e.stopPropagation();
  }, []);

  return (
    <g onClick={onClick} className="cursor-position">
      <line x1={x - size} x2={x + size} y1={y} y2={y} />
      <line x1={x} x2={x} y1={y - size} y2={y + size} />
      <circle cx={x} cy={y} r={size} />
    </g>
  );
};

const computeRectFromEndpoints = ({ start, end }) => {
  let _end = end || start;

  const startX = Math.min(start.x, _end.x);
  const startY = Math.min(start.y, _end.y);
  const endX = Math.max(start.x, _end.x);
  const endY = Math.max(start.y, _end.y);

  return {
    x: startX,
    y: startY,
    width: endX - startX,
    height: endY - startY
  };
};

function useForceUpdate() {
  const [, setValue] = useState(0); // integer state
  return () => setValue(value => ++value); // update the state to force render
}

const extractEventCoordinates = e => {
  const dim = e.target.getBoundingClientRect();
  return {
    x: e.clientX - dim.left,
    y: e.clientY - dim.top
  };
};

export function SvgCanvas({
  width,
  height,
  definition,
  resolvedVariables,
  activeElements,
  setActiveElements,
  toggleActiveElement,
  onUpdateActive,
  markForCollapse,
  collapse,
  cursorPosition,
  setCursorPosition,
  setDragging
}) {
  const isDragging = useRef(null);
  const selectionParams = useRef(null);
  const elementRefs = useRef({});
  const forceUpdate = useForceUpdate();
  const [selectionBox, setSelectionBox] = useState(null);

  const [_width, _height] = useMemo(() => {
    if (definition.rotation === 1 || definition.rotation === 3) {
      return [height, width];
    } else {
      return [width, height];
    }
  }, [width, height, definition]);

  const updateRef = useCallback((type, id, ref) => {
    const refs = elementRefs.current;
    if (!refs[type]) {
      refs[type] = {};
    }
    if (!refs[type][id]) {
      refs[type][id] = {};
    }

    refs[type][id] = ref;
  }, []);

  const svgStyle = useMemo(
    () => ({
      backgroundColor: definition.background_color || "white"
    }),
    [definition.background_color]
  );

  const isRegionActive = useCallback(
    (regionType, index) =>
      activeElements.some(x => x[0] == regionType && x[1] == index),
    [activeElements]
  );

  //
  // Canvas event listeners.  Handles the following:
  //   * Selection box dragging
  //   * Drag-moving selected elements
  //   * Setting cursor position
  //
  const eventListeners = useMemo(() => {
    const endMouseMove = e => {
      let acted = false;

      if (isDragging.current) {
        onUpdateActive(
          defn => {
            delete defn.__drag;
          },
          { skipHistory: true }
        );
        acted = true;
      } else if (selectionParams.current && selectionParams.current.end) {
        const selectionBox = computeRectFromEndpoints(selectionParams.current);

        // Ignore if selection is tiny (probably means it was intended as click)

        if (selectionBox.width > 1 || selectionBox.height > 1) {
          setSelectionBox(selectionBox);
          acted = true;
        }
      }

      collapse();
      isDragging.current = false;
      selectionParams.current = null;

      // tell parent component we're done dragging
      setDragging(false);

      return acted;
    };

    return {
      onMouseDown: e => {
        if (e.target.classList.contains("active")) {
          isDragging.current = true;
          // tell parent component we're dragging
          setDragging(true);

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
        } else if (!isDragging.current && e.target.tagName === "svg") {
          selectionParams.current = {
            start: extractEventCoordinates(e)
          };
          forceUpdate();
        }
      },
      onClick: e => {
        if (!endMouseMove(e)) {
          setCursorPosition(extractEventCoordinates(e));
        }
      },
      onMouseLeave: endMouseMove,
      onMouseMove: e => {
        if (isDragging.current) {
          if (!e.buttons) {
            endMouseMove(e);
            return;
          }

          onUpdateActive(dfn => {
            const ctx = original(dfn.__drag);

            if (ctx) {
              dfn.__drag.moved = true;

              ctx.start.x.forEach(([field, start]) => {
                dfn[field] = start + (e.pageX - ctx.cursor.x);
              });
              ctx.start.y.forEach(([field, start]) => {
                dfn[field] = start + (e.pageY - ctx.cursor.y);
              });
            }
          });
        } else if (e.target.tagName === "svg" && selectionParams.current) {
          selectionParams.current.end = extractEventCoordinates(e);
          forceUpdate();
        }
      }
    };
  }, [onUpdateActive]);

  //
  // Handle selection box.
  //
  // Set the list of active elements equal to those that intersect with
  // the selection box.
  //
  useEffect(() => {
    if (selectionBox) {
      const active = Object.keys(FieldTypeDefinitions).flatMap(type => {
        const refs = elementRefs.current;
        return (definition[type] || [])
          .map((x, i) => {
            const elementRef = refs[type] && refs[type][i];

            if (
              elementRef &&
              rectOverlaps(elementRef.getBBox(), selectionBox)
            ) {
              return [type, i];
            }
          })
          .filter(x => x);
      });

      setActiveElements(active);
      setSelectionBox(null);
    }
  }, [definition, selectionBox]);

  return (
    <svg
      {...eventListeners}
      viewBox={`0 0 ${_width} ${_height}`}
      style={svgStyle}
      className={selectionParams.current ? "selecting" : ""}
    >
      {Object.keys(FieldTypeDefinitions)
        .flatMap(type =>
          (definition[type] || []).map((x, i) => {
            const resolvedValue =
              resolvedVariables[type] && resolvedVariables[type][i];

            return (
              <WrappedSvgElement
                elementRef={updateRef}
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
      {selectionParams.current && (
        <rect
          className="selection"
          {...computeRectFromEndpoints(selectionParams.current)}
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;8"
            dur="1s"
            repeatCount="indefinite"
          />
        </rect>
      )}
      {cursorPosition && <SvgCursorIndicator {...cursorPosition} />}
    </svg>
  );
}
