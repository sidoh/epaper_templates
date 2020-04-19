import { useMemo } from "react";
import { original } from "immer";

export const MarkedForDeletion = "__deleted";

const SupportedColors = {
  B: "black",
  W: "white",
  Y: "yellow",
  R: "red",
};

const FontDefinitions = {
  FreeMonoBold24pt7b: {
    title: "FreeMono Bold",
    style: {
      fontSize: 24,
      fontFamily: "'FreeMono Bold', monospace",
    },
  },
  FreeSans18pt7b: {
    title: "Free Sans",
    style: {
      fontSize: 18,
      fontWeight: 100,
      fontFamily: "FreeSans, sans-serif",
    },
  },
  FreeSans12pt7b: {
    title: "Free Sans",
    style: {
      fontSize: 12,
      fontWeight: 100,
      fontFamily: "FreeSans, sans-serif",
    },
  },
  FreeSans9pt7b: {
    title: "Free Sans",
    style: {
      fontSize: 9,
      fontWeight: 100,
      fontFamily: "FreeSans, sans-serif",
    },
  },
  FreeSansBold9pt7b: {
    title: "Free Sans Bold",
    style: {
      fontWeight: "bold",
      fontSize: 9,
      fontFamily: '"FreeSans Bold", sans-serif',
    },
  },
  FreeMono9pt7b: {
    title: "Free Mono",
    style: {
      fontSize: 9,
      fontFamily: "FreeMono, monospace",
    },
  },
};

export const getFontDefinition = (font) => {
  return FontDefinitions[font] || FontDefinitions.FreeMono9pt7b;
};

const LineFields = {
  type: "object",
  title: "Line",
  properties: {
    x1: { $ref: "#/definitions/horizontalPosition" },
    x2: { $ref: "#/definitions/horizontalPosition" },
    y1: { $ref: "#/definitions/verticalPosition" },
    y2: { $ref: "#/definitions/verticalPosition" },
    color: { $ref: "#/definitions/color" },
  },
};

const RectangleFields = {
  type: "object",
  title: "Rectangle",
  properties: {
    x: { $ref: "#/definitions/horizontalPosition" },
    y: { $ref: "#/definitions/verticalPosition" },
    style: { $ref: "#/definitions/fillStyle" },
    color: { $ref: "#/definitions/color" },
    w: { title: "Width", $ref: "#/definitions/valueChoice" },
    h: { title: "Height", $ref: "#/definitions/valueChoice" },
  },
};

const TextFields = {
  type: "object",
  title: "Text",
  properties: {
    x: { $ref: "#/definitions/horizontalPosition" },
    y: { $ref: "#/definitions/verticalPosition" },
    font: { $ref: "#/definitions/font" },
    font_size: { type: "integer", title: "Font Size" },
    color: { $ref: "#/definitions/color" },
    value: { title: "Value", $ref: "#/definitions/valueChoice" },
  },
};

const BitmapFields = {
  type: "object",
  title: "Bitmap",
  properties: {
    x: { $ref: "#/definitions/horizontalPosition" },
    y: { $ref: "#/definitions/verticalPosition" },
    w: { title: "Width", $ref: "#/definitions/horizontalPosition" },
    h: { title: "Height", $ref: "#/definitions/verticalPosition" },
    background_color: {
      title: "Background Color",
      $ref: "#/definitions/color",
    },
    color: { $ref: "#/definitions/color" },
    value: {
      title: "Value",
      type: "object",
      properties: {
        type: {
          title: "Type",
          type: "string",
          enum: ["static", "variable"],
        },
      },
      dependencies: {
        type: {
          oneOf: [
            {
              type: "object",
              properties: {
                type: { enum: ["static"] },
                value: { title: "Value", $ref: "#/definitions/storedBitmap" },
              },
            },
            {
              type: "object",
              properties: {
                type: { enum: ["variable"] },
                variable: { $ref: "#/definitions/variable" },
                formatter: { $ref: "#/definitions/formatter" },
              },
            },
          ],
        },
      },
    },
  },
};

const Definitions = {
  referenceFormatter: {
    type: "object",
    title: "Formatter Definition",
    properties: {
      name: {
        title: "Reference Name",
        type: "string",
        pattern: "^[a-zA-Z0-9_0]+$",
      },
      formatter: { title: "", $ref: "#/definitions/formatter" },
    },
    required: ["name"],
  },
  color: {
    title: "Color",
    type: "string",
    enum: Object.values(SupportedColors),
  },
  fillStyle: {
    title: "Style",
    type: "string",
    enum: ["outline", "filled"],
  },
  storedBitmap: {
    type: "string",
  },
  storedFormatter: {
    type: "string",
  },
  horizontalPosition: {
    type: "integer",
    minimum: 0,
  },
  verticalPosition: {
    type: "integer",
    minimum: 0,
  },
  variable: {
    title: "Variable Name",
    type: "string",
  },
  font: {
    title: "Font",
    type: "string",
    enum: Object.keys(FontDefinitions),
    enumNames: Object.values(FontDefinitions).map(
      (x) => `${x.title} (${x.style.fontSize}pt)`
    ),
  },
  caseFormatterItem: {},
  valueChoice: {
    type: "object",
    properties: {
      type: {
        title: "Type",
        type: "string",
        enum: ["static", "variable"],
      },
    },
    dependencies: {
      type: {
        oneOf: [
          {
            type: "object",
            properties: {
              type: { enum: ["static"] },
              value: { title: "Value", type: "string" },
            },
          },
          {
            type: "object",
            properties: {
              type: { enum: ["variable"] },
              variable: { $ref: "#/definitions/variable" },
              formatter: { $ref: "#/definitions/formatter" },
            },
          },
        ],
      },
    },
  },
  formatter: {
    title: "Formatter",
    type: "object",
    required: ["type"],
    properties: {
      type: {
        title: "Type",
        type: "string",
        enum: [
          "ref",
          "identity",
          "time",
          "round",
          "cases",
          "ratio",
          "pfstring",
          "pfnumeric",
        ],
        enumNames: [
          "Pre-Defined Formatter",
          "Identity (No-Op)",
          "Time (strftime)",
          "Round",
          "Cases",
          "Ratio",
          "Printf (String)",
          "Printf (int)",
        ],
      },
      args: {
        type: "object",
        title: "Arguments",
      },
    },
    dependencies: {
      type: {
        oneOf: [
          {
            properties: {
              type: {
                enum: ["identity"],
              },
            },
          },
          {
            properties: {
              type: {
                enum: ["cases"],
              },
              args: {
                type: "object",
                properties: {
                  prefix: {
                    title: "Prefix",
                    type: "string",
                  },
                  default: {
                    title: "Default Value",
                    type: "string",
                  },
                  cases: {
                    type: "array",
                    title: "Cases",
                    items: {
                      type: "object",
                      properties: {
                        key: {
                          type: "string",
                          title: "Key",
                        },
                        value: {
                          type: "string",
                          title: "Value",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            properties: {
              type: {
                enum: ["time"],
              },
              args: {
                type: "object",
                properties: {
                  format: {
                    title: "Format String (strftime)",
                    type: "string",
                  },
                },
              },
            },
          },
          {
            properties: {
              type: {
                enum: ["round"],
              },
              args: {
                type: "object",
                properties: {
                  digits: {
                    title: "Number of digits",
                    type: "integer",
                  },
                },
              },
            },
          },
          {
            properties: {
              type: {
                enum: ["ref"],
              },
              ref: { $ref: "#/definitions/storedFormatter" },
            },
          },
          {
            properties: {
              type: {
                enum: ["ratio"],
              },
              args: {
                type: "object",
                properties: {
                  base: {
                    title: "Base value",
                    type: "number",
                  },
                },
              },
            },
          },
          {
            properties: {
              type: {
                enum: ["pfstring"],
              },
              args: {
                type: "object",
                properties: {
                  format: {
                    title: "Printf (String)",
                    type: "string",
                  },
                },
              },
            },
          },
          {
            properties: {
              type: {
                enum: ["pfnumeric"],
              },
              args: {
                type: "object",
                properties: {
                  format: {
                    title: "Printf (int)",
                    type: "string",
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
};

export const FieldTypeDefinitions = {
  bitmaps: BitmapFields,
  text: TextFields,
  rectangles: RectangleFields,
  lines: LineFields,
};

const DefaultElementFactories = {
  bitmaps: (x, y) => {
    return { x, y, w: 32, h: 32 };
  },
  text: (x, y) => {
    return { x, y, value: { type: "static", value: "text" } };
  },
  lines: (x, y) => {
    return { x1: x, y1: y, x2: x + 20, y2: y };
  },
  rectangles: (x, y) => {
    const dim = { type: "static", value: 30 };
    return { x, y, w: dim, h: dim };
  },
};

// Called after button is clicked, held, and cursor is moved.  e.g., when
// dragging to create a box of certain dimensions or line
const DefaultElementUpdaters = {
  bitmaps: (e, el, x, y) => {
    el.x = x;
    el.y = y;
  },
  text: (e, el, x, y) => {
    el.x = x;
    el.y = y;
  },
  lines: (e, el, x, y) => {
    if (!e.shiftKey) {
      el.x2 = x;
      el.y2 = y;
    } else {
      const dX = Math.abs(el.x1 - x);
      const dY = Math.abs(el.y1 - y);

      if (dX > dY) {
        el.x2 = x;
        el.y2 = el.y1;
      } else {
        el.x2 = el.x1;
        el.y2 = y;
      }
    }
  },
  rectangles: (e, el, x, y) => {
    const { x: x1, y: y1 } = el.__mousedown;

    let w = Math.abs(x - x1);
    let h = Math.abs(y - y1);

    if (e.shiftKey) {
      w = Math.max(w, h);
      h = Math.max(w, h);
    }

    el.x = Math.min(x, x1);
    el.w.value = w;

    el.y = Math.min(y, y1);
    el.h.value = h;
  },
};

export const createDefaultElement = (
  type,
  { position: { x = 0, y = 0 } = {} } = {}
) => {
  const fn = DefaultElementFactories[type] || (() => ({}));
  return fn(...[x, y].map((x) => Math.round(x)));
};

export const updateDefaultElement = (
  e,
  defn,
  { position: { x = 0, y = 0 } = {} } = {}
) => {
  // only update if first position has been received
  if (defn.__mousedown) {
    const fn = DefaultElementUpdaters[defn.__creating] || (() => ({}));
    return fn(...[e, defn, ...[x, y].map((x) => Math.round(x))]);
  }
};

const ScreenSettings = {
  type: "object",
  properties: {
    background_color: {
      title: "Background Color",
      $ref: "#/definitions/color",
    },
    rotation: {
      title: "Screen Rotation",
      type: "integer",
      enum: [0, 1, 2, 3],
      enumNames: ["0°", "90°", "180°", "270°"],
    },
  },
};

export const Schema = {
  $id: "https://sidoh.github.io/epaper_templates/template.schema.json",
  $schema: "https://json-schema.org/draft-08/schema#",
  type: "object",
  definitions: { ...Definitions },
  properties: {
    background_color: { $ref: "#/definitions/color" },
    ...ScreenSettings.properties,
    formatters: {
      type: "array",
      items: { $ref: "#/definitions/referenceFormatter" },
    },
    ...Object.fromEntries(
      Object.entries(FieldTypeDefinitions).map(([k, v]) => {
        return [
          k,
          {
            type: "array",
            items: { ...v },
          },
        ];
      })
    ),
  },
};

export const ScreenSettingsSchema = {
  definitions: { ...Definitions },
  ...ScreenSettings,
};

export const createScreenSettingsSchema = ({ screenMetadata }) => {
  return {
    definitions: {
      ...Definitions,
      ...createColorDefinition({ colorStr: screenMetadata.colors }),
    },
    ...ScreenSettings
  };
};

export const FormatterSchema = {
  type: "object",
  definitions: { ...Definitions },
  $ref: "#/definitions/referenceFormatter",
};

const createColorDefinition = ({ colorStr }) => {
  return {
    color: {
      title: "Color",
      type: "string",
      enum: colorStr.split("").map((x) => SupportedColors[x]),
    },
  };
};

export default function createSchema({
  screenMetadata,
  selectedFields,
  allBitmaps,
  allFormatters,
  rotation
}) {
  const uniqueTypes = Array.from(new Set(selectedFields.map(x => x[0])));

  // If screen is rotated 90 or 270 deg, x and y bounds are flipped.
  const xMax = (rotation % 2 == 0) ? screenMetadata.width : screenMetadata.height;
  const yMax = (rotation % 2 == 0) ? screenMetadata.height : screenMetadata.width;

  let enabledFields = {};

  uniqueTypes.forEach(x => {
    const typeFields = FieldTypeDefinitions[x];

    if (!enabledFields.properties) {
      enabledFields = { ...typeFields };
    } else {
      const overlappingFields = Object.entries(enabledFields.properties).filter(
        ([k, v]) => typeFields.properties[k]
      );

      enabledFields = {
        type: "object",
        properties: Object.fromEntries(overlappingFields)
      };
    }
  });

  return {
    ...enabledFields,
    definitions: {
      ...Definitions,
      horizontalPosition: {
        type: "integer",
        minimum: 0,
        maximum: xMax
      },
      verticalPosition: {
        type: "integer",
        minimum: 0,
        maximum: yMax
      },
      storedBitmap: {
        type: "string",
        enum: allBitmaps
      },
      storedFormatter: {
        title: "Formatter",
        type: "string",
        enum: allFormatters
      }
    }
  };
}
