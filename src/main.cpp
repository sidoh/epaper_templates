#include <Arduino.h>

#include <GxEPD.h>
#include <GxGDEW042T2/GxGDEW042T2.cpp>
#include <GxIO/GxIO_SPI/GxIO_SPI.cpp>
#include <GxIO/GxIO.cpp>

#include <TimeLib.h>
#include <NtpClientLib.h>
#include <Timezone.h>

#include <DisplayTemplateDriver.h>
#include <WebServer.h>
#include <MqttClient.h>

GxIO_Class io(SPI, SS, D3, D4);
GxEPD_Class display(io);

Settings settings;
// Config config;

DisplayTemplateDriver driver(&display, settings);
WebServer webServer(driver, settings);
MqttClient* mqttClient = NULL;

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

void setup() {
  Serial.begin(115200);
  SPIFFS.begin();

  Settings::load(settings);
  settings.onUpdate(applySettings);

  WiFi.hostname(settings.hostname);
  WiFi.begin();
  WiFi.waitForConnectResult();

  NTP.begin("pool.ntp.org", 0, false);
  NTP.setInterval(63);

  webServer.begin();
  driver.init();

  applySettings();

  Serial.println(WiFi.localIP().toString());
  Serial.println(ESP.getFreeHeap());
}

void loop() {
  if (timeStatus() == timeSet && lastSecond != second()) {
    lastSecond = second();
    driver.updateVariable("timestamp", String(now()));
    Serial.println(ESP.getFreeHeap());
  }

  webServer.loop();
  driver.loop();

  if (mqttClient != NULL) {
    mqttClient->handleClient();
  }
}
