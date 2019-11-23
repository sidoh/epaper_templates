import { useMemo } from "react";

const LineFields = {
  type: "object",
  properties: {
    x1: { $ref: "#/definitions/horizontalPosition" },
    x2: { $ref: "#/definitions/horizontalPosition" },
    y1: { $ref: "#/definitions/verticalPosition" },
    y2: { $ref: "#/definitions/verticalPosition" }
  }
};

const RectangleFields = {
  type: "object",
  properties: {
    x: { $ref: "#/definitions/horizontalPosition" },
    y: { $ref: "#/definitions/verticalPosition" },
    width: {
      oneOf: [
        {
          title: "Fixed",
          properties: { static: "#/definitions/horizontalPosition" }
        },
        {
          title: "Dynamic",
          properties: {
            max: "#/definitions/horizontalPosition",
            variable: { type: "#/definitions/variable" },
            variable_mode: { type: "#/definitions/variableMode" }
          }
        }
      ]
    },
    height: {
      oneOf: [
        {
          title: "Fixed",
          properties: { static: "#/definitions/verticalPosition" }
        },
        {
          title: "Dynamic",
          properties: {
            max: "#/definitions/verticalPosition",
            variable: { type: "#/definitions/variable" },
            variable_mode: { type: "#/definitions/variableMode" }
          }
        }
      ]
    }
  }
};

const TextFields = {
  type: "object",
  properties: {
    x: { $ref: "#/definitions/horizontalPosition" },
    y: { $ref: "#/definitions/verticalPosition" },
    font: { $ref: "#/definitions/font" },
    font_size: { type: "integer", default: 1, title: "Font Size" },
    value: { $ref: "#/definitions/valueChoice" }
  }
};

const BitmapFields = {
  type: "object",
  properties: {
    x: { $ref: "#/definitions/horizontalPosition" },
    y: { $ref: "#/definitions/verticalPosition" },
    w: { $ref: "#/definitions/horizontalPosition" },
    h: { $ref: "#/definitions/verticalPosition" },
    value: { $ref: "#/definitions/valueChoice" }
  }
};

const FieldTypeDefinitions = {
  bitmaps: BitmapFields,
  text: TextFields,
  rectangles: RectangleFields,
  lines: LineFields
};

export default function createSchema({ screenMetadata, selectedFields }) {
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
      variable: {
        title: "Variable Name",
        type: "string"
      },
      variableMode: {
        type: "string",
        enum: ["percent", "absolute"]
      },
      font: {
        type: "string",
        enum: [
          "FreeMonoBold24pt7b",
          "FreeSans18pt7b",
          "FreeSans9pt7b",
          "FreeSansBold9pt7b",
          "FreeMono9pt7b"
        ]
      },
      caseFormatterItem: {},
      valueChoice: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["static", "variable"],
            default: "static"
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
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["ref", "identity", "time", "round", "switch"],
            default: "identity"
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
                    enum: ["switch"]
                  },
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
                        title: "strtimef format",
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
                  digits: {
                    title: "Number of digits",
                    type: "integer"
                  }
                }
              },
              {
                properties: {
                  type: {
                    enum: ["ref"]
                  },
                  ref: {
                    title: "Formatter Name",
                    type: "string"
                  }
                }
              }
            ]
          }
        }
      }
    }
  };
}
