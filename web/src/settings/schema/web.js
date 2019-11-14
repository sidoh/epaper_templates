export default {
  key: "web",
  title: "Web",
  properties: {
    "web.admin_username": {
      $id: "#/properties/web.admin_username",
      type: "string",
      title: "Admin Username",
      default: "",
      examples: [""],
      pattern: "^(.*)$"
    },
    "web.admin_password": {
      $id: "#/properties/web.admin_password",
      type: "string",
      title: "Admin Password",
      default: "",
      examples: [""],
      pattern: "^(.*)$"
    },
    "web.port": {
      $id: "#/properties/web.port",
      type: "integer",
      title: "Port"
    }
  }
};