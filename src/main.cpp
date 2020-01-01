#include <Arduino.h>

#include <WiFi.h>

// Make sure TimeLib.h is included first so that Time.h doesn't get included.
// This breaks builds on case-sensitive filesystems.
#include <TimeLib.h>
#include <EnvironmentConfig.h>
#include <Bleeper.h>

#if defined(ESP32)
#include <WebServer.h>
#elif defined(ESP8266)
#include <ESP8266WebServer.h>
#define WEBSERVER_H
#endif
#include <ESPAsyncWebServer.h>

#include <WiFiManager.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <Timezone.h>

#include <GxEPD2.h>
#include <GxEPD2_EPD.h>
#include <GxEPD2_BW.h>
#include <GxEPD2_GFX.h>
#include <DisplayTypeHelpers.h>

#include <Settings.h>
#include <DisplayTemplateDriver.h>
#include <EpaperWebServer.h>
#include <MqttClient.h>

enum class WiFiState {
  CONNECTED, DISCONNECTED
};

Settings settings;
GxEPD2_GFX* display = NULL;
DisplayTemplateDriver* driver = NULL;
EpaperWebServer* webServer = NULL;
MqttClient* mqttClient = NULL;

// Don't attempt to reconnect to wifi if we've never connected
volatile bool hasConnected = false;
volatile bool shouldRestart = false;

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

uint8_t lastSecond = 60;

void initDisplay() {
  if (display) {
    delete display;
    display = NULL;
  }

  display = DisplayTypeHelpers::buildDisplay(
    settings.display.display_type,
    settings.hardware.dc_pin,
    settings.hardware.rst_pin,
    settings.hardware.busy_pin
  );

  if (driver != NULL) {
    delete driver;
    driver = NULL;
  }

  driver = new DisplayTemplateDriver(display, settings);
  driver->init();
}

void applySettings() {
  Serial.println(F("Applying settings"));

  Timezones.setDefaultTimezone(*settings.system.timezone);

  if (hasConnected && settings.network.wifi_ssid.length() > 0 && settings.network.wifi_ssid != WiFi.SSID()) {
    Serial.println(F("Switching WiFi networks"));

    WiFi.disconnect(true);
    WiFi.begin(settings.network.wifi_ssid.c_str(), settings.network.wifi_password.c_str());
  }

  if (mqttClient != NULL) {
    delete mqttClient;
    mqttClient = NULL;
  }

  if (settings.mqtt.serverHost().length() > 0) {
    mqttClient = new MqttClient(
      settings.mqtt.serverHost(),
      settings.mqtt.serverPort(),
      settings.mqtt.variables_topic_pattern,
      settings.mqtt.username,
      settings.mqtt.password
    );
    mqttClient->onVariableUpdate([](const String& variable, const String& value) {
      driver->updateVariable(variable, value);
    });
    mqttClient->begin();
  }

  if (settings.display.template_name.length() > 0) {
    driver->setTemplate(settings.display.template_name);
  }

  if (webServer == NULL) {
    webServer = new EpaperWebServer(driver, settings);
    webServer->onSettingsChange(applySettings);
    webServer->begin();
  // Get stupid exceptions when trying to tear down old webserver.  Easier to just restart.
  } else if (settings.web.port != webServer->getPort()) {
    shouldRestart = true;
  }
}

void updateWiFiState(WiFiState state) {
  const char varName[] = "wifi_state";
  const String varValue = state == WiFiState::CONNECTED ? "connected" : "disconnected";

  driver->updateVariable(varName, varValue);
}

#if defined(ESP32)
void onWifiEvent(WiFiEvent_t event) {
  switch (event) {
    case SYSTEM_EVENT_STA_START:
      WiFi.setHostname(settings.network.hostname.c_str());
      break;

    case SYSTEM_EVENT_STA_DISCONNECTED:
      updateWiFiState(WiFiState::DISCONNECTED);
      break;

    case SYSTEM_EVENT_STA_GOT_IP:
      updateWiFiState(WiFiState::CONNECTED);
      break;

    default:
      break;
  }
}
#elif defined(ESP8266)
void onWiFiConnected(const WiFiEventStationModeGotIP& event) {
  updateWiFiState(WiFiState::CONNECTED);
}
void onWiFiDisconnected(const WiFiEventStationModeDisconnected& event) {
  updateWiFiState(WiFiState::DISCONNECTED);
}
#endif

void wifiManagerConfigSaved() {
  Serial.println(F("Config saved"));

  settings.network.wifi_ssid = WiFi.SSID();
  settings.network.wifi_password = WiFi.psk();
  Bleeper.storage.persist();

  // Restart for good measure
  ESP.restart();
}

void setup() {
  Serial.begin(115200);

  Bleeper
    .verbose()
    .configuration
      .set(&settings)
      .done()
    .storage
      .set(new SPIFFSStorage())
      .done()
    .init();

  initDisplay();

  WiFiManager wifiManager;

#if defined(ESP8266)
  WiFi.setAutoReconnect(true);
  WiFi.hostname(settings.network.hostname);
  WiFi.onStationModeGotIP(onWiFiConnected);
  WiFi.onStationModeDisconnected(onWiFiDisconnected);
#elif defined(ESP32)
  WiFi.setAutoReconnect(true);
  WiFi.onEvent(onWifiEvent);
#endif

  char setupSsid[20];
  sprintf(setupSsid, "epaper_%d", ESP_CHIP_ID());

  wifiManager.setSaveConfigCallback(wifiManagerConfigSaved);
  wifiManager.autoConnect(setupSsid, settings.network.setup_ap_password.c_str());

  if (settings.network.mdns_name.length() > 0) {
    if (! MDNS.begin(settings.network.mdns_name.c_str())) {
      Serial.println(F("Error setting up MDNS responder"));
    } else {
      MDNS.addService("http", "tcp", 80);
    }
  }

  timeClient.begin();

  applySettings();
}

void loop() {
  if (shouldRestart) {
    ESP.restart();
  }

  if (timeClient.update() && lastSecond != second()) {
    lastSecond = second();
    driver->updateVariable("timestamp", String(timeClient.getEpochTime()));
  }

  if (webServer) {
    webServer->handleClient();
  }

  driver->loop();
}