import { useMemo } from "react";

const LineFields = {
  type: "object",
  title: "Lines",
  properties: {
    x1: { $ref: "#/definitions/horizontalPosition" },
    x2: { $ref: "#/definitions/horizontalPosition" },
    y1: { $ref: "#/definitions/verticalPosition" },
    y2: { $ref: "#/definitions/verticalPosition" }
  }
};

const RectangleFields = {
  type: "object",
  title: "Rectangles",
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
  title: "Text",
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
  title: "Bitmaps",
  properties: {
    x: { $ref: "#/definitions/horizontalPosition" },
    y: { $ref: "#/definitions/verticalPosition" },
    w: { $ref: "#/definitions/horizontalPosition" },
    h: { $ref: "#/definitions/verticalPosition" },
    value: { $ref: "#/definitions/valueChoice" }
  }
};

const Definitions = {
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
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["ref", "identity", "time", "round", "cases"]
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
};

const FieldTypeDefinitions = {
  bitmaps: BitmapFields,
  text: TextFields,
  rectangles: RectangleFields,
  lines: LineFields
};

export const Schema = {
  $id: "https://sidoh.org/epaper-templates/template.schema.json",
  $schema: "https://json-schema.org/draft-08/schema#",
  type: "object",
  definitions: { ...Definitions },
  properties: {
    background_color: {
      type: "string",
      enum: ["black", "white"]
    },
    formatters: {
      type: "array",
      items: {
        $ref: "#/definitions/formatter"
      }
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
      }
    }
  };
}
