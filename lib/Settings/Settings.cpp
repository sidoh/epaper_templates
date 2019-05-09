#include <Settings.h>
#include <FS.h>

#define PORT_POSITION(s) ( s.indexOf(':') )

Settings::Settings()
  : fullRefreshPeriod(3600000),
    hostname("epaper-display"),
    onUpdateFn(NULL),
    timezoneName(TimezonesClass::DEFAULT_TIMEZONE_NAME),
    setupApPassword("waveshare"),
    mdnsName("epaper-display"),
    webPort(80),
    dcPin(EPD_DEFAULT_DC_PIN),
    rstPin(EPD_DEFAULT_RST_PIN),
    busyPin(EPD_DEFAULT_BUSY_PIN)
{ }

Settings::~Settings() { }

void Settings::onUpdate(TSettingsUpdateFn fn) {
  this->onUpdateFn = fn;
}

bool Settings::hasAuthSettings() {
  return adminUsername.length() > 0 && adminPassword.length() > 0;
}

void Settings::patch(JsonObject parsedSettings) {
  if (!parsedSettings.isNull()) {
    this->setIfPresent<String>(parsedSettings, "web.admin_username", adminUsername);
    this->setIfPresent(parsedSettings, "web.admin_password", adminPassword);
    this->setIfPresent(parsedSettings, "web.port", webPort);
    this->setIfPresent(parsedSettings, "web.mdns_name", mdnsName);
    this->setIfPresent(parsedSettings, "mqtt.server", _mqttServer);
    this->setIfPresent(parsedSettings, "mqtt.username", mqttUsername);
    this->setIfPresent(parsedSettings, "mqtt.password", mqttPassword);
    this->setIfPresent(parsedSettings, "mqtt.variables_topic_pattern", mqttVariablesTopicPattern);

    this->setIfPresent(parsedSettings, "display.full_refresh_period", fullRefreshPeriod);
    this->setIfPresent(parsedSettings, "display.template_path", templatePath);
    this->setIfPresent(parsedSettings, "display.dc_pin", dcPin);
    this->setIfPresent(parsedSettings, "display.rst_pin", rstPin);
    this->setIfPresent(parsedSettings, "display.busy_pin", busyPin);

    this->setIfPresent(parsedSettings, "local.timezone", timezoneName);

    this->setIfPresent(parsedSettings, "wifi.setup_ap_password", setupApPassword);
    this->setIfPresent(parsedSettings, "wifi.hostname", hostname);
    this->setIfPresent(parsedSettings, "wifi.ssid", wifiSsid);
    this->setIfPresent(parsedSettings, "wifi.password", wifiPassword);

    if (this->onUpdateFn != NULL) {
      this->onUpdateFn();
    }
  }
}

void Settings::load(Settings& settings) {
  if (SPIFFS.exists(SETTINGS_FILE)) {
    DynamicJsonDocument jsonBuffer(4096);
    File f = SPIFFS.open(SETTINGS_FILE, "r");
    deserializeJson(jsonBuffer, f);
    f.close();

    settings.patch(jsonBuffer.as<JsonObject>());
  } else {
    settings.save();
  }
}

void Settings::save() {
  File f = SPIFFS.open(SETTINGS_FILE, "w");

  if (!f) {
    Serial.println(F("Opening settings file failed"));
  } else {
    serialize(f);
    f.close();
  }
}

void Settings::serialize(Stream& stream, const bool prettyPrint) {
  DynamicJsonDocument jsonBuffer(4096);
  JsonObject root = jsonBuffer.to<JsonObject>();

  root["web.admin_username"] = this->adminUsername;
  root["web.admin_password"] = this->adminPassword;
  root["web.port"] = this->webPort;
  root["web.mdns_name"] = this->mdnsName;

  root["mqtt.server"] = this->_mqttServer;
  root["mqtt.username"] = this->mqttUsername;
  root["mqtt.password"] = this->mqttPassword;
  root["mqtt.variables_topic_pattern"] = this->mqttVariablesTopicPattern;

  root["display.full_refresh_period"] = this->fullRefreshPeriod;
  root["display.template_path"] = this->templatePath;
  root["display.dc_pin"] = this->dcPin;
  root["display.rst_pin"] = this->rstPin;
  root["display.busy_pin"] = this->busyPin;

  root["local.timezone"] = this->timezoneName;

  root["wifi.setup_ap_password"] = this->setupApPassword;
  root["wifi.hostname"] = this->hostname;
  root["wifi.ssid"] = this->wifiSsid;
  root["wifi.password"] = this->wifiPassword;

  if (prettyPrint) {
    serializeJsonPretty(root, stream);
  } else {
    serializeJson(root, stream);
  }
}

Timezone& Settings::getTimezone() {
  return Timezones.getTimezone(timezoneName);
}

void Settings::setTimezone(const String &timezone) {
  // Resolve to TZ and back to name to make sure it's valid
  this->timezoneName = Timezones.getTimezoneName(Timezones.getTimezone(timezone));
}

String Settings::mqttServer() {
  int pos = PORT_POSITION(_mqttServer);

  if (pos == -1) {
    return _mqttServer;
  } else {
    return _mqttServer.substring(0, pos);
  }
}

uint16_t Settings::mqttPort() {
  int pos = PORT_POSITION(_mqttServer);

  if (pos == -1) {
    return DEFAULT_MQTT_PORT;
  } else {
    return atoi(_mqttServer.c_str() + pos + 1);
  }
}

SettingsAuthProvider::SettingsAuthProvider(Settings& settings)
  : settings(settings)
{ }

bool SettingsAuthProvider::isAuthenticationEnabled() const {
  return settings.hasAuthSettings();
}

const String& SettingsAuthProvider::getUsername() const {
  return settings.adminUsername;
}

const String& SettingsAuthProvider::getPassword() const {
  return settings.adminPassword;
}