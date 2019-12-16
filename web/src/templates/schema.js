import { useMemo } from "react";

export const MarkedForDeletion = "__deleted";

const FontDefinitions = {
  FreeMonoBold24pt7b: {
    title: "FreeMono Bold",
    style: {
      fontSize: 24,
      fontFamily: "'FreeMono Bold', monospace"
    }
  },
  FreeSans18pt7b: {
    title: "Free Sans",
    style: {
      fontSize: 18,
      fontWeight: 100,
      fontFamily: "FreeSans, sans-serif"
    }
  },
  FreeSans9pt7b: {
    title: "Free Sans",
    style: {
      fontSize: 9,
      fontWeight: 100,
      fontFamily: "FreeSans, sans-serif"
    }
  },
  FreeSansBold9pt7b: {
    title: "Free Sans Bold",
    style: {
      fontWeight: "bold",
      fontSize: 9,
      fontFamily: '"FreeSans Bold", sans-serif'
    }
  },
  FreeMono9pt7b: {
    title: "Free Mono",
    style: {
      fontSize: 9,
      fontFamily: "FreeMono, monospace"
    }
  }
};

export const getFontDefinition = font => {
  return FontDefinitions[font] || FontDefinitions.FreeMono9pt7b;
};

const LineFields = {
  type: "object",
  title: "Line",
  properties: {
    x1: { $ref: "#/definitions/horizontalPosition" },
    x2: { $ref: "#/definitions/horizontalPosition" },
    y1: { $ref: "#/definitions/verticalPosition" },
    y2: { $ref: "#/definitions/verticalPosition" }
  }
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
    h: { title: "Height", $ref: "#/definitions/valueChoice" }
  }
};

const TextFields = {
  type: "object",
  title: "Text",
  properties: {
    x: { $ref: "#/definitions/horizontalPosition" },
    y: { $ref: "#/definitions/verticalPosition" },
    font: { $ref: "#/definitions/font" },
    font_size: { type: "integer", title: "Font Size" },
    value: { title: "Value", $ref: "#/definitions/valueChoice" }
  }
};

const BitmapFields = {
  type: "object",
  title: "Bitmap",
  properties: {
    x: { $ref: "#/definitions/horizontalPosition" },
    y: { $ref: "#/definitions/verticalPosition" },
    w: { $ref: "#/definitions/horizontalPosition" },
    h: { $ref: "#/definitions/verticalPosition" },
    color: { $ref: "#/definitions/color" },
    value: {
      title: "Value",
      type: "object",
      properties: {
        type: {
          title: "Type",
          type: "string",
          enum: ["static", "variable"]
        }
      },
      dependencies: {
        type: {
          oneOf: [
            {
              type: "object",
              properties: {
                type: { enum: ["static"] },
                value: { $ref: "#/definitions/storedBitmap" }
              }
            },
            {
              type: "object",
              properties: {
                type: { enum: ["variable"] },
                variable: { $ref: "#/definitions/variable" },
                formatter: { $ref: "#/definitions/formatter" }
              }
            }
          ]
        }
      }
    }
  }
};

const Definitions = {
  referenceFormatter: {
    type: "object",
    title: "Formatter Definition",
    properties: {
      name: {
        title: "Reference Name",
        type: "string",
        pattern: "^[a-zA-Z0-9_0]+$"
      },
      formatter: { title: "", $ref: "#/definitions/formatter" }
    },
    required: ["name"]
  },
  fillStyle: {
    title: "Style",
    type: "string",
    enum: ["outline", "filled"]
  },
  color: {
    title: "Color",
    type: "string",
    enum: ["black", "white"]
  },
  storedBitmap: {
    type: "string"
  },
  storedFormatter: {
    type: "string"
  },
  horizontalPosition: {
    type: "integer",
    minimum: 0
  },
  verticalPosition: {
    type: "integer",
    minimum: 0
  },
  variable: {
    title: "Variable Name",
    type: "string"
  },
  font: {
    title: "Font",
    type: "string",
    enum: Object.keys(FontDefinitions),
    enumNames: Object.values(FontDefinitions).map(
      x => `${x.title} (${x.style.fontSize}pt)`
    )
  },
  caseFormatterItem: {},
  valueChoice: {
    type: "object",
    properties: {
      type: {
        title: "Type",
        type: "string",
        enum: ["static", "variable"]
      }
    },
    dependencies: {
      type: {
        oneOf: [
          {
            type: "object",
            properties: {
              type: { enum: ["static"] },
              value: { title: "Value", type: "string" }
            }
          },
          {
            type: "object",
            properties: {
              type: { enum: ["variable"] },
              variable: { $ref: "#/definitions/variable" },
              formatter: { $ref: "#/definitions/formatter" }
            }
          }
        ]
      }
    }
  },
  formatter: {
    title: "Formatter",
    type: "object",
    required: ["type"],
    properties: {
      type: {
        title: "Type",
        type: "string",
        enum: ["ref", "identity", "time", "round", "cases", "ratio"],
        enumNames: [
          "Pre-Defined Formatter",
          "Identity (No-Op)",
          "Time (strftime)",
          "Round",
          "Cases",
          "Ratio"
        ]
      },
      args: {
        type: "object",
        title: "Arguments"
      }
    },
    dependencies: {
      type: {
        oneOf: [
          {
            properties: {
              type: {
                enum: ["identity"]
              }
            }
          },
          {
            properties: {
              type: {
                enum: ["cases"]
              },
              args: {
                type: "object",
                properties: {
                  prefix: {
                    title: "Prefix",
                    type: "string"
                  },
                  default: {
                    title: "Default Value",
                    type: "string"
                  },
                  cases: {
                    type: "array",
                    title: "Cases",
                    items: {
                      type: "object",
                      properties: {
                        key: {
                          type: "string",
                          title: "Key"
                        },
                        value: {
                          type: "string",
                          title: "Value"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            properties: {
              type: {
                enum: ["time"]
              },
              args: {
                type: "object",
                properties: {
                  format: {
                    title: "Format String (strftime)",
                    type: "string"
                  }
                }
              }
            }
          },
          {
            properties: {
              type: {
                enum: ["round"]
              },
              args: {
                type: "object",
                properties: {
                  digits: {
                    title: "Number of digits",
                    type: "integer"
                  }
                }
              }
            }
          },
          {
            properties: {
              type: {
                enum: ["ref"]
              },
              ref: { $ref: "#/definitions/storedFormatter" }
            }
          },
          {
            properties: {
              type: {
                enum: ["ratio"]
              },
              args: {
                type: "object",
                properties: {
                  base: {
                    title: "Base value",
                    type: "number"
                  }
                }
              }
            }
          }
        ]
      }
    }
  }
};

export const FieldTypeDefinitions = {
  bitmaps: BitmapFields,
  text: TextFields,
  rectangles: RectangleFields,
  lines: LineFields
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
  }
};

export const createDefaultElement = (
  type,
  { position: { x = 0, y = 0 } = {} } = {}
) => {
  const fn = DefaultElementFactories[type] || (() => ({}));
  return fn(...[x, y].map(x => Math.round(x)));
};

const ScreenSettings = {
  type: "object",
  properties: {
    background_color: {
      title: "Background Color",
      $ref: "#/definitions/color"
    },
    rotation: {
      title: "Screen Rotation",
      type: "integer",
      enum: [0, 1, 2, 3],
      enumNames: ["0°", "90°", "180°", "270°"]
    }
  }
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
      items: { $ref: "#/definitions/referenceFormatter" }
    },
    ...Object.fromEntries(
      Object.entries(FieldTypeDefinitions).map(([k, v]) => {
        return [
          k,
          {
            type: "array",
            items: { ...v }
          }
        ];
      })
    )
  }
};

export const ScreenSettingsSchema = {
  definitions: { ...Definitions },
  ...ScreenSettings
};

export const FormatterSchema = {
  type: "object",
  definitions: { ...Definitions },
  $ref: "#/definitions/referenceFormatter"
};

export default function createSchema({
  screenMetadata,
  selectedFields,
  allBitmaps,
  allFormatters
}) {
  const uniqueTypes = Array.from(new Set(selectedFields.map(x => x[0])));
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
        maximum: screenMetadata.width
      },
      verticalPosition: {
        type: "integer",
        minimum: 0,
        maximum: screenMetadata.height
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
