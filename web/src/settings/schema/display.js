export default (displayTypes) => ({
  key: "display",
  title: "Display",
  properties: {
    "display.display_type": {
      $id: "#/properties/display.display_type",
      oneOf: displayTypes.screens.map(x => ({
        const: x.name,
        title: `${x.name} (${x.desc})`
      })),
      type: "string",
      title: "Display Type",
      default: "GDEW042T2",
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
});