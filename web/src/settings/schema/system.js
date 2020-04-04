export default {
  key: "system",
  title: "System",
  properties: {
    "system.timezone": {
      $id: "#/properties/system.timezone",
      type: "string",
      oneOf: [
        { const: "PT", title: "(GMT-07:00) Pacific Time" },
        { const: "AZ", title: "(GMT-06:00) Arizona Time" },
        { const: "MT", title: "(GMT-06:00) Mountain Time" },
        { const: "CT", title: "(GMT-05:00) Central Time" },
        { const: "ET", title: "(GMT-04:00) Eastern Time" },
        { const: "UTC", title: "(GMT+00:00) Coordinated Universal Time" },
        { const: "UK", title: "(GMT+00:00) Western Europe Time" },
        { const: "CET", title: "(GMT+01:00) Central European Time" },
        { const: "MSK", title: "(GMT+03:00) Moscow Standard Time" },
        { const: "AUSET", title: "(GMT+10:00) Eastern Australia" },
      ],
      title: "Timezone",
      default: "",
      examples: ["PT"],
      pattern: "^(.*)$",
    },
  },
};
