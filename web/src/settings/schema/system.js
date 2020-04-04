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
      title: "Timezone",
      default: "",
      examples: ["PT"],
      pattern: "^(.*)$"
    }
  }
};
