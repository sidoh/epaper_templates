#ifndef UNIT_TEST

#include <Arduino.h>
#include <WiFi.h>

// Make sure TimeLib.h is included first so that Time.h doesn't get included.
// This breaks builds on case-sensitive filesystems.
#include <Bleeper.h>
#include <EnvironmentConfig.h>
#include <TimeLib.h>

#if defined(ESP32)
#include <WebServer.h>
#elif defined(ESP8266)
#include <ESP8266WebServer.h>
#define WEBSERVER_H
#endif
#include <DisplayTemplateDriver.h>
#include <DisplayTypeHelpers.h>
#include <ESPAsyncWebServer.h>
#include <EpaperWebServer.h>
#include <GxEPD2.h>
#include <GxEPD2_BW.h>
#include <GxEPD2_EPD.h>
#include <GxEPD2_GFX.h>
#include <MqttClient.h>
#include <NTPClient.h>
#include <Settings.h>
#include <Timezone.h>
#include <WiFiManager.h>
#include <WiFiUdp.h>

enum class WiFiState { CONNECTED, DISCONNECTED };

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

// Keep track of whether or not the system has already been
// initialized.  We use this to distinguish between booting and
// settings being re-applied at runtime.
bool initialized = false;

// We'll set this to true in applySettings if the sleep suspend pin
// is held the the appropriate value.
bool suspendSleep = false;

// Store the sleep mode at initialization time.  If not done this
// way, the system will likely immediately go into deep sleep after
// settings are saved, which is confusing.
SleepMode initialSleepMode = SleepMode::ALWAYS_ON;

void cancelSleep() {
  if (initialSleepMode == SleepMode::DEEP_SLEEP) {
    Serial.println(F("Cancelling deep sleep mode"));
    suspendSleep = true;

    if (webServer) {
      webServer->setDeepSleepActive(false);
    }
  }
}

void initDisplay() {
  #if defined(ESP32)
  if (settings.hardware.spi_bus == VSPI){
    SPI.end();
    SPI.begin(18, 23, 19, 5);
  }
  #endif

  if (display) {
    delete display;
    display = NULL;
  }

  display = DisplayTypeHelpers::buildDisplay(settings.display.display_type,
      settings.hardware.dc_pin,
      settings.hardware.rst_pin,
      settings.hardware.busy_pin);

  if (driver != NULL) {
    delete driver;
    driver = NULL;
  }

  driver = new DisplayTemplateDriver(display, settings);
  driver->init();
}

void initSleepSettings() {
  if (settings.power.sleep_mode == SleepMode::DEEP_SLEEP) {
    uint8_t overrideValue = settings.power.sleep_override_value;
    // Use the internal pull-up/pull-down resistors
    uint8_t overridePinMode =
        overrideValue == HIGH ? INPUT_PULLDOWN : INPUT_PULLUP;
    pinMode(settings.power.sleep_override_pin, overridePinMode);
    webServer->setDeepSleepActive(true);
  }
}

void applySettings() {
  Serial.println(F("Applying settings"));

  Timezones.setDefaultTimezone(*settings.system.timezone);

  if (hasConnected && settings.network.wifi_ssid.length() > 0 &&
      settings.network.wifi_ssid != WiFi.SSID()) {
    Serial.println(F("Switching WiFi networks"));

    WiFi.disconnect(true);
    WiFi.begin(settings.network.wifi_ssid.c_str(),
        settings.network.wifi_password.c_str());
  }

  if (mqttClient != NULL) {
    delete mqttClient;
    mqttClient = NULL;
  }

  if (settings.mqtt.serverHost().length() > 0) {
    mqttClient = new MqttClient(settings.mqtt.serverHost(),
        settings.mqtt.serverPort(),
        settings.mqtt.variables_topic_pattern,
        settings.mqtt.username,
        settings.mqtt.password,
        settings.mqtt.client_status_topic);
    mqttClient->onVariableUpdate(
        [](const String& variable, const String& value) {
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
    webServer->onCancelSleep(cancelSleep);
    webServer->begin();
    // Get stupid exceptions when trying to tear down old webserver.  Easier to
    // just restart.
  } else if (settings.web.port != webServer->getPort()) {
    shouldRestart = true;
  }

  initSleepSettings();

  // Only run this once.  Don't want to re-check this stuff when settings are
  // re-applied.
  if (!initialized) {
    initialSleepMode = settings.power.sleep_mode;
  }

  initialized = true;
}

void updateWiFiState(WiFiState state) {
  const char varName[] = "wifi_state";
  const String varValue =
      state == WiFiState::CONNECTED ? "connected" : "disconnected";

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

  Bleeper.verbose()
      .configuration.set(&settings)
      .done()
      .storage.set(new SPIFFSStorage())
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
  wifiManager.autoConnect(setupSsid,
      settings.network.setup_ap_password.c_str());

  if (settings.network.mdns_name.length() > 0) {
    if (!MDNS.begin(settings.network.mdns_name.c_str())) {
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

  if (!suspendSleep && initialSleepMode == SleepMode::DEEP_SLEEP) {
    if (digitalRead(settings.power.sleep_override_pin) == settings.power.sleep_override_value) {
      Serial.println(F("Sleep override pin was held.  Suspending deep sleep."));
      suspendSleep = true;
    } else if (millis() >= (settings.power.awake_duration * 1000)) {
      Serial.printf_P(
          PSTR("Wake duration expired.  Going to sleep for %d seconds...\n"),
          settings.power.sleep_duration);
      Serial.flush();

      // Make sure the display is off while we sleep
      if (display) {
        display->hibernate();
      }

      // Convert to microseconds
      esp_sleep_enable_timer_wakeup(settings.power.sleep_duration * 1000000ULL);
      esp_deep_sleep_start();
    }
  }

  driver->loop();
}

#endif // UNIT_TEST