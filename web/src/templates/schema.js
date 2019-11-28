import { useMemo } from "react";

export const MarkedForDeletion = "__deleted";

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
    font_size: { type: "integer", default: 1, title: "Font Size" },
    value: { $ref: "#/definitions/valueChoice" }
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
    properties: {
      name: {
        title: "Reference Name",
        type: "string",
        pattern: "^[a-zA-Z0-9_0]+$"
      },
      formatter: { $ref: "#/definitions/formatter" }
    },
    required: ["name"]
  },
  fillStyle: {
    type: "string",
    enum: ["outline", "filled"],
    default: "outline"
  },
  color: {
    type: "string",
    enum: ["black", "white"],
    default: "black"
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
    required: ["type"],
    properties: {
      type: {
        type: "string",
        enum: ["ref", "identity", "time", "round", "cases", "ratio"]
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

export const Schema = {
  $id: "https://sidoh.org/epaper-templates/template.schema.json",
  $schema: "https://json-schema.org/draft-08/schema#",
  type: "object",
  definitions: { ...Definitions },
  properties: {
    background_color: { $ref: "#/definitions/color" },
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
        type: "string",
        enum: allFormatters
      }
    }
  };
}
