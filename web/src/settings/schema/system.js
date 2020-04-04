export default {
  key: "system",
  title: "System",
  properties: {
    "system.timezone": {
      $id: "#/properties/system.timezone",
      type: "string",
      enum: [
        "AUSET", "MSK", "CET", "UK", "UTC", "ET", "CT", "MT", "AZ", "PT"
      ],
      enumNames: [
        "Australia Eastern Time +10",
        "Moscow Standard Time +3",
        "Central European Time +1",
        "UK Time +1",
        "UTC +0",
        "US Eastern Time -5",
        "US Central Time -6",
        "US Mountain Time -7",
        "Arizona -7 (no dst)",
        "US Pacific Time -8"
      ],
      title: "Timezone",
      default: "",
      examples: ["PT"],
      pattern: "^(.*)$"
    }
  }
};