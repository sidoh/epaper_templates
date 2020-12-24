#include <Settings.h>
#include <FS.h>

#define PORT_POSITION(s) ( s.indexOf(':') )

String MqttSettings::serverHost() const {
  int pos = PORT_POSITION(server);

  if (pos == -1) {
    return server;
  } else {
    return server.substring(0, pos);
  }
}

uint16_t MqttSettings::serverPort() const {
  int pos = PORT_POSITION(server);

  if (pos == -1) {
    return DEFAULT_MQTT_PORT;
  } else {
    return atoi(server.c_str() + pos + 1);
  }
}

bool WebSettings::isAuthenticationEnabled() const {
  return admin_username.length() > 0 && admin_password.length() > 0;
}

const String& WebSettings::getUsername() const {
  return this->admin_username;
}

const String& WebSettings::getPassword() const {
  return this->admin_password;
}

void Settings::save() {
  Bleeper.storage.persist();
}

void Settings::patch(JsonObject obj) {
  ConfigurationDictionary params;

  for (JsonObject::iterator it = obj.begin(); it != obj.end(); ++it) {
    params[it->key().c_str()] = it->value().as<String>();
  }

  this->setFromDictionary(params);
  this->save();
}

void Settings::dump(Print& s) {
  DynamicJsonDocument json(4096);
  ConfigurationDictionary params = this->getAsDictionary(true);

  for (std::map<String, String>::const_iterator it = params.begin(); it != params.end(); ++it) {
    json[it->first] = it->second;
  }

  serializeJson(json, s);
}

SettingsCallbackObserver::SettingsCallbackObserver(CallbackFn callback)
  : callback(callback)
{ }

void SettingsCallbackObserver::onConfigurationChanged(const ConfigurationPropertyChange value) {
  if (this->callback) {
    this->callback(value);
  }
}

const uint8_t HardwareSettings::getSsPin() const {
  if (this->ss_pin_override != -1) {
    return static_cast<uint8_t>(this->ss_pin_override);
  }

  switch (this->spi_bus) {
    case HSPI:
    case WAVESHARE_SPI:
      return 15;
    case VSPI:
    default:
      return 5;
  }
}