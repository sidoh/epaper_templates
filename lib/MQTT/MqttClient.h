#include <WiFiClient.h>
#include <PubSubClient.h>
#include <TokenIterator.h>

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
  void handleClient();
  void reconnect();
  void onVariableUpdate(TVariableUpdateFn fn);

private:
  WiFiClient tcpClient;
  PubSubClient* mqttClient;

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

  bool connect();
  void subscribe();
  void publishCallback(char* topic, uint8_t* payload, unsigned int length);
};

#endif
