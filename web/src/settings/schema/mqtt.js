export default {
  key: "mqtt",
  title: "MQTT",
  properties: {
    "mqtt.server": {
      $id: "#/properties/mqtt.server",
      type: "string",
      title: "Server Hostname",
      default: "",
      examples: [],
      pattern: "^(.*)$"
    },
    "mqtt.username": {
      $id: "#/properties/mqtt.username",
      type: "string",
      title: "Username",
      default: "",
      examples: [],
      pattern: "^(.*)$"
    },
    "mqtt.password": {
      $id: "#/properties/mqtt.password",
      type: "string",
      title: "Password",
      default: "",
      examples: [""],
      pattern: "^(.*)$"
    },
    "mqtt.variables_topic_pattern": {
      $id: "#/properties/mqtt.variables_topic_pattern",
      type: "string",
      title: "Variables Topic Pattern",
      examples: ["template-displays/my-display/:variable_name"],
      pattern: "^(.*)$"
    }
  }
};
