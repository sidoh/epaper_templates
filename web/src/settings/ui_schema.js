export default {
  "display.display_type": {
    "ui:help": "Model of the e-paper display you're using"
  },
  "display.windowed_updates": {
    "ui:help":
      "When enabled, update partial regions of the screen.  Only enable this if your display does not support partial updates.",
    transformer: x => x.toLowerCase() === "true"
  },
  "mqtt.password": {
    "ui:widget": "password"
  },
  "web.admin_password": {
    "ui:widget": "password"
  },
  "network.wifi_password": {
    "ui:widget": "password"
  },
  "hardware.busy_pin": {
    transformer: parseInt
  },
  "hardware.dc_pin": {
    transformer: parseInt
  },
  "hardware.rst_pin": {
    transformer: parseInt
  },
  "web.port": {
    transformer: parseInt
  }
};