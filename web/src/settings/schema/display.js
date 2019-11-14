export default {
  key: "display",
  title: "Display",
  properties: {
    "display.display_type": {
      $id: "#/properties/display.display_type",
      enum: [
        "GDEP015OC1",
        "GDE0213B1",
        "GDEH0213B72",
        "GDEH0213B73",
        "GDEW0213I5F",
        "GDEW026T0",
        "GDEH029A1",
        "GDEW029T5",
        "GDEW027W3",
        "GDEW0371W7",
        "GDEW042T2",
        "GDEW0583T7",
        "GDEW075T8",
        "GDEW075T7",
        "ED060SCT",
        "GDEW0154Z04",
        "GDEW0213Z16",
        "GDEW029Z10",
        "GDEW027C44",
        "GDEW042Z15",
        "GDEW0583Z21",
        "GDEW075Z09",
        "GDEW075Z08"
      ],
      type: "string",
      title: "Display Type",
      default: "GDEW042Z15",
      examples: ["GDEW042T2"]
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