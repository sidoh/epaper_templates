export default {
  key: "power",
  title: "Power",
  definitions: {
    pin: {
      type: "integer",
      enum: [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39
      ]
    }
  },
  properties: {
    "power.sleep_mode": {
      $id: "#/properties/network.sleep_mode",
      title: "Sleep Mode",
      oneOf: [
        { const: "ALWAYS_ON", title: "Always On" },
        { const: "DEEP_SLEEP", title: "Deep Sleep" }
      ],
      type: "string",
      default: "ALWAYS_ON"
    }
  },
  required: ["power.sleep_mode"],
  dependencies: {
    "power.sleep_mode": {
      oneOf: [
        {
          properties: {
            "power.sleep_mode": {
              enum: ["ALWAYS_ON"]
            }
          }
        },
        {
          properties: {
            "power.sleep_mode": {
              enum: ["DEEP_SLEEP"]
            },
            "power.sleep_duration": {
              $id: "#/properties/network.sleep_duration",
              title: "Sleep Duration (in seconds)",
              type: "string",
              pattern: "^(.*)$",
              default: "600"
            },
            "power.awake_duration": {
              $id: "#/properties/network.awake_duration",
              title: "Awake Duration (in seconds)",
              type: "string",
              pattern: "^(.*)$",
              default: "30"
            },
            "power.sleep_override_pin": {
              $id: "#/properties/network.sleep_override_pin",
              title: "Sleep Override Pin",
              $ref: "#/definitions/pin"
            },
            "power.sleep_override_value": {
              $id: "#/properties/network.sleep_override_value",
              title: "Sleep Override Value",
              oneOf: [
                { const: "1", title: "HIGH" },
                { const: "0", title: "LOW" }
              ],
              type: "string",
              default: "1"
            }
          }
        }
      ]
    }
  }
};
