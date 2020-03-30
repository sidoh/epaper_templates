export default {
  key: "hardware",
  title: "Hardware",
  definitions: {
    pin: {
      type: "integer",
      enum: [
        0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39
      ]
    }
  },
  properties: {
    "hardware.busy_pin": {
      $id: "#/properties/hardware.busy_pin",
      title: "Busy Pin",
      $ref: "#/definitions/pin",
    },
    "hardware.dc_pin": {
      $id: "#/properties/hardware.dc_pin",
      title: "DC Pin",
      $ref: "#/definitions/pin"
    },
    "hardware.rst_pin": {
      $id: "#/properties/hardware.rst_pin",
      title: "RST Pin",
      $ref: "#/definitions/pin"
    },
    "hardware.spi_bus": {
      $id: "#/properties/hardware.spi_bus",
      title: "SPI Bus",
      oneOf: [
        { const: "HSPI", title: "HSPI (default)" },
        { const: "VSPI", title: "VSPI" }
      ],
      type: "string",
      default: "HSPI"
    }
  }
};
