export default {
  key: "system",
  title: "System",
  properties: {
    "system.timezone": {
      $id: "#/properties/system.timezone",
      type: "string",
      enum: [
        "PT", "MT", "AZ", "CT", "ET", "UK"
      ],
      title: "Timezone",
      default: "",
      examples: ["PT"],
      pattern: "^(.*)$"
    }
  }
};
