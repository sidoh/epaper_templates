#include <AsyncMqttClient.h>
#include <TokenIterator.h>

#if defined(ESP8266)
#include <Ticker.h>
#include <ESP8266WiFi.h>
#elif defined(ESP32)
#include <WiFi.h>
extern "C" {
	#include "freertos/FreeRTOS.h"
	#include "freertos/timers.h"
}
#endif

#ifndef _MQTT_CLIENT_H
#define _MQTT_CLIENT_H

#define MQTT_TOPIC_VARIABLE_NAME_TOKEN "variable_name"

#ifndef MQTT_CONNECTION_ATTEMPT_FREQUENCY
#define MQTT_CONNECTION_ATTEMPT_FREQUENCY 5000
#endif

class MqttClient {
public:
  typedef std::function<void(const String&, const String&)> TVariableUpdateFn;

  MqttClient(String domain, uint16_t port, String variableTopicPattern);
  MqttClient(
    String domain,
    uint16_t port,
    String variableTopicPattern,
    String username,
    String password
  );
  ~MqttClient();

  void begin();
  void onVariableUpdate(TVariableUpdateFn fn);

private:
  AsyncMqttClient mqttClient;
  #if defined(ESP8266)
  Ticker reconnectTimer;
  static void internalCallback(MqttClient* client);
  #elif defined(ESP32)
  TimerHandle_t reconnectTimer;
  static void internalCallback(TimerHandle_t xTimer);
  #endif

  uint16_t port;
  String domain;
  String username;
  String password;

  unsigned long lastConnectAttempt;
  TVariableUpdateFn variableUpdateCallback;

  // This will get reused a bunch.  Allows us to avoid copying into a buffer
  // every time a message is received.
  String topicPattern;
  char* topicPatternBuffer;
  TokenIterator* topicPatternTokens;

  void connect();

  void messageCallback(
    char* topic,
    char* payload,
    AsyncMqttClientMessageProperties properties,
    size_t len,
    size_t index,
    size_t total
  );
  void connectCallback(bool sessionPresent);
  void disconnectCallback(AsyncMqttClientDisconnectReason reason);
};

#endif
