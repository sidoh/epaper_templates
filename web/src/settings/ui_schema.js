import React from 'react'
import MemoizedFontAwesomeIcon from '../util/MemoizedFontAwesomeIcon'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

export default {
  "display.display_type": {
    "ui:help": "Model of the e-paper display you're using"
  },
  "display.windowed_updates": {
    "ui:help":
      "When enabled, update partial regions of the screen.  Only enable this if your display does not support partial updates.",
    transformer: x => x.toLowerCase() === "true"
  },
  "power.sleep_mode": {
    "ui:help": (
      <ul className="mt-2">
        <li>
          <b>Always On</b> &mdash; Normal operation. System stays powered at all
          times
        </li>
        <li>
          <b>Deep Sleep</b> &mdash; Conserve power. System continuously boots
          for a configurable period waiting for updates, and then puts itself to
          sleep for a configurable period.
        </li>
      </ul>
    )
  },
  "power.sleep_override_pin": {
    "ui:help":
      "When this pin is held during boot, deep sleep will be disabled until the next restart.",
    transformer: parseInt
  },
  "power.sleep_override_value": {
    "ui:help": "The value Sleep Override Pin must be held to in order to suspend deep sleep."
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
  "hardware.spi_bus": {
    "ui:help": <>
    <div>
      SPI bus to use.  HSPI uses GPIOs 12, 14, 15.  VSPI uses 5, 18, 19.  See README for more details.
    </div>
    <div>
      <MemoizedFontAwesomeIcon icon={faExclamationTriangle} className="text-warning fa-fw mr-1" />
      <b>Changing any of these settings requires a reboot!</b>
    </div>
    </>
  },
  "web.port": {
    transformer: parseInt
  },
  "mqtt.client_status_topic": {
    "ui:help": "If provided, MQTT birth and LWT messages will be published to this topic."
  }
};
