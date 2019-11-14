export default {
  key: "network",
  title: "Network",
  properties: {
    "network.hostname": {
      $id: "#/properties/network.hostname",
      type: "string",
      title: "Hostname",
      examples: ["epaper-display"],
      pattern: "^(.*)$"
    },
    "network.mdns_name": {
      $id: "#/properties/network.mdns_name",
      type: "string",
      title: "mDNS Name",
      default: "",
      examples: ["epaper-display"],
      pattern: "^(.*)$"
    },
    "network.setup_ap_password": {
      $id: "#/properties/network.setup_ap_password",
      type: "string",
      title: "Setup AP Password",
      default: "",
      examples: ["waveshare"],
      pattern: "^(.*)$"
    },
    "network.wifi_ssid": {
      $id: "#/properties/network.wifi_ssid",
      type: "string",
      title: "WiFi SSID",
      default: "",
      examples: [""],
      pattern: "^(.*)$"
    },
    "network.wifi_password": {
      $id: "#/properties/network.wifi_password",
      type: "string",
      title: "WiFi Password",
      default: "",
      examples: [""],
      pattern: "^(.*)$"
    },
  }
};
