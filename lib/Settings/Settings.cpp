#include <Settings.h>
#include <FS.h>

#define PORT_POSITION(s) ( s.indexOf(':') )

Settings::Settings()
  : fullRefreshPeriod(3600000),
    hostname("epaper-display"),
    onUpdateFn(NULL),
    timezoneName(TimezonesClass::DEFAULT_TIMEZONE_NAME)
{ }

Settings::~Settings() { }

void Settings::onUpdate(TSettingsUpdateFn fn) {
  this->onUpdateFn = fn;
}

bool Settings::hasAuthSettings() {
  return adminUsername.length() > 0 && adminPassword.length() > 0;
}

void Settings::deserialize(Settings& settings, String json) {
  DynamicJsonBuffer jsonBuffer;
  JsonObject& parsedSettings = jsonBuffer.parseObject(json);
  settings.patch(parsedSettings);
}

void Settings::patch(JsonObject& parsedSettings) {
  if (parsedSettings.success()) {
    this->setIfPresent<String>(parsedSettings, "admin_username", adminUsername);
    this->setIfPresent(parsedSettings, "admin_password", adminPassword);
    this->setIfPresent(parsedSettings, "mqtt_server", _mqttServer);
    this->setIfPresent(parsedSettings, "mqtt_username", mqttUsername);
    this->setIfPresent(parsedSettings, "mqtt_password", mqttPassword);
    this->setIfPresent(parsedSettings, "mqtt_variables_topic_pattern", mqttVariablesTopicPattern);
    this->setIfPresent(parsedSettings, "full_refresh_period", fullRefreshPeriod);
    this->setIfPresent(parsedSettings, "hostname", hostname);
    this->setIfPresent(parsedSettings, "template_path", templatePath);
    this->setIfPresent(parsedSettings, "timezone", timezoneName);

    if (this->onUpdateFn != NULL) {
      this->onUpdateFn();
    }
  }
}

void Settings::load(Settings& settings) {
  if (SPIFFS.exists(SETTINGS_FILE)) {
    File f = SPIFFS.open(SETTINGS_FILE, "r");
    String settingsContents = f.readStringUntil(SETTINGS_TERMINATOR);
    f.close();

    deserialize(settings, settingsContents);
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
  DynamicJsonBuffer jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();

  root["admin_username"] = this->adminUsername;
  root["admin_password"] = this->adminPassword;
  root["mqtt_server"] = this->_mqttServer;
  root["mqtt_username"] = this->mqttUsername;
  root["mqtt_password"] = this->mqttPassword;
  root["mqtt_variables_topic_pattern"] = this->mqttVariablesTopicPattern;
  root["full_refresh_period"] = this->fullRefreshPeriod;
  root["hostname"] = this->hostname;
  root["template_path"] = this->templatePath;
  root["timezone"] = this->timezoneName;

  if (prettyPrint) {
    root.prettyPrintTo(stream);
  } else {
    root.printTo(stream);
  }
}

String Settings::toJson(const bool prettyPrint) {
  String buffer = "";
  StringStream s(buffer);
  serialize(s, prettyPrint);
  return buffer;
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
