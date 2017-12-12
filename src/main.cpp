#include <Arduino.h>
#include <EnvironmentConfig.h>

#include <GxEPD.h>
#include <GxGDEW042T2/GxGDEW042T2.cpp>
#include <GxIO/GxIO_SPI/GxIO_SPI.cpp>
#include <GxIO/GxIO.cpp>

#include <WiFiManager.h>
#include <ESPAsyncWebServer.h>
#include <TimeLib.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <Timezone.h>

#include <DisplayTemplateDriver.h>
#include <EpaperWebServer.h>
#include <MqttClient.h>

#if defined(ESP8266)
GxIO_Class io(SPI, SS, D3, D4);
GxEPD_Class display(io);
#elif defined(ESP32)
GxIO_Class io(SPI, SS, 17, 16);
GxEPD_Class display(io, 16, 4);
#endif

Settings settings;

DisplayTemplateDriver driver(&display, settings);
EpaperWebServer webServer(driver, settings);
MqttClient* mqttClient = NULL;

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

uint8_t lastSecond = 60;

void applySettings() {
  if (mqttClient != NULL) {
    delete mqttClient;
    mqttClient = NULL;
  }

  if (settings.mqttServer().length() > 0) {
    mqttClient = new MqttClient(
      settings.mqttServer(),
      settings.mqttPort(),
      settings.mqttVariablesTopicPattern,
      settings.mqttUsername,
      settings.mqttPassword
    );
    mqttClient->onVariableUpdate([](const String& variable, const String& value) {
      driver.updateVariable(variable, value);
    });
    mqttClient->begin();
  }

  if (settings.templatePath.length() > 0) {
    driver.setTemplate(settings.templatePath);
  }
}

#if defined(ESP32)
void onWifiEvent(WiFiEvent_t event) {
  if (event == SYSTEM_EVENT_STA_START) {
    WiFi.setHostname(settings.hostname.c_str());
  }
}
#endif

void setup() {
  Serial.begin(115200);

#if defined(ESP8266)
  if (! SPIFFS.begin()) {
#elif defined(ESP32)
  if (! SPIFFS.begin(true)) {
#endif
    Serial.println(F("Failed to mount SPIFFS!"));
  }

  Settings::load(settings);
  settings.onUpdate(applySettings);

  WiFiManager wifiManager;

#if defined(ESP8266)
  WiFi.hostname(settings.hostname);
#elif defined(ESP32)
  WiFi.onEvent(onWifiEvent);
#endif

  char setupSsid[20];
  sprintf(setupSsid, "epaper_%d", ESP_CHIP_ID());
  wifiManager.autoConnect(setupSsid, settings.setupApPassword.c_str());

  timeClient.begin();
  webServer.begin();
  driver.init();

  applySettings();

  Serial.println(WiFi.localIP().toString());
  Serial.println(ESP.getFreeHeap());
}

void loop() {
  if (timeClient.update() && lastSecond != second()) {
    lastSecond = second();
    driver.updateVariable("timestamp", String(timeClient.getEpochTime()));
  }

  driver.loop();
}
