export default {
  key: "display",
  title: "Display",
  properties: {
    "display.display_type": {
      $id: "#/properties/display.display_type",
      enum: [
        "GDEP015OC1 (1.54\" B/W)",
        "GDEW0154Z04 (1.54\" B/W/R)",
        "GDE0213B1 (2.13\" B/W)",
        "GDEH0213B72 (2.13\" B/W)",
        "GDEH0213B73 (2.13\" B/W)",
        "GDEW0213I5F (2.13\" B/W FLEX)",
        "GDEW0213Z16 (2.13\" B/W/R)",
        "GDEH029A1 (2.9\" B/W)",
        "GDEW029T5 (2.9\" B/W)",
        "GDEW029Z10 (2.9\" B/W/R)",
        "GDEW026T0 (2.6\" B/W)",
        "GDEW027C44 (2.7\" B/W/R)",
        "GDEW027W3 (2.7\" B/W)",
        "GDEW0371W7 (3.7\" B/W)",
        "GDEW042T2 (4.2\" B/W)",
        "GDEW042Z15 (4.2\" B/W/R)",
        "GDEW0583T7 (5.83\" B/W)",
        "GDEW0583Z21 (5.83\" B/W/R)",
        "ED060SCT (6\" B/W)",
        "GDEW075T8 (7.5\" B/W)",
        "GDEW075T7 (7.5\" B/W 800X480)",
        "GDEW075Z09 (7.5\" B/W/R)",
        "GDEW075Z08 (7.5\" B/W/R 800X480)"
      ],
      type: "string",
      title: "Display Type",
      default: "GDEW042T2 (4.2\" B/W)",
      examples: ["GDEW042T2 (4.2\" B/W)"]
    },
    "display.full_refresh_period": {
      $id: "#/properties/display.full_refresh_period",
      type: "string",
      title: "Full Refresh Period (in milliseconds)",
      examples: ["36000000"],
      pattern: "^\\d+$"
    },
    "display.template_name": {
      $id: "#/properties/display.template_name",
      type: "string",
      title: "Template",
      default: "",
      examples: [],
      pattern: "^(.*)$"
    },
    "display.windowed_updates": {
      $id: "#/properties/display.windowed_updates",
      type: "boolean",
      title: "Windowed Updates",
      default: false
    }
  }
};