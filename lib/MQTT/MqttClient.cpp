#include <MqttClient.h>
#include <ArduinoJson.h>
#include <Settings.h>
#include <TokenIterator.h>
#include <UrlTokenBindings.h>

MqttClient::MqttClient(
  String domain,
  uint16_t port,
  String variableTopicPattern,
  String username,
  String password
) : lastConnectAttempt(0),
    variableUpdateCallback(NULL),
    port(port),
    domain(domain),
    username(username),
    password(password),
    topicPattern(variableTopicPattern)
{
  this->topicPatternBuffer = new char[topicPattern.length() + 1];
  strcpy(this->topicPatternBuffer, this->topicPattern.c_str());
  this->topicPatternTokens = new TokenIterator(this->topicPatternBuffer, topicPattern.length(), '/');

  this->mqttClient = new PubSubClient(tcpClient);
}

MqttClient::~MqttClient() {
  mqttClient->disconnect();
  delete this->topicPatternTokens;
  delete this->topicPatternBuffer;
}

void MqttClient::onVariableUpdate(TVariableUpdateFn fn) {
  this->variableUpdateCallback = fn;
}

void MqttClient::begin() {
  mqttClient->setServer(this->domain.c_str(), port);
  mqttClient->setCallback(
    [this](char* topic, byte* payload, int length) {
      this->publishCallback(topic, payload, length);
    }
  );
  reconnect();
}

bool MqttClient::connect() {
  char nameBuffer[30];
  sprintf_P(nameBuffer, PSTR("epaper-display-%u"), ESP.getChipId());

#ifdef MQTT_DEBUG
    Serial.println(F("MqttClient - connecting"));
#endif

  if (username.length() > 0) {
    return mqttClient->connect(
      nameBuffer,
      username.c_str(),
      password.c_str()
    );
  } else {
    return mqttClient->connect(nameBuffer);
  }
}

void MqttClient::reconnect() {
  if (lastConnectAttempt > 0 && (millis() - lastConnectAttempt) < MQTT_CONNECTION_ATTEMPT_FREQUENCY) {
    return;
  }

  if (! mqttClient->connected()) {
    if (connect()) {
      subscribe();

#ifdef MQTT_DEBUG
      Serial.println(F("MqttClient - Successfully connected to MQTT server"));
#endif
    } else {
      Serial.println(F("ERROR: Failed to connect to MQTT server"));
    }
  }

  lastConnectAttempt = millis();
}

void MqttClient::handleClient() {
  reconnect();
  mqttClient->loop();
}

void MqttClient::subscribe() {
  String topic = this->topicPattern;
  topic.replace(String(":") + MQTT_TOPIC_VARIABLE_NAME_TOKEN, "+");

#ifdef MQTT_DEBUG
  printf("MqttClient - subscribing to topic: %s\n", topic.c_str());
#endif

  mqttClient->subscribe(topic.c_str());
}

void MqttClient::publishCallback(char* topic, byte* payload, int length) {
  char cstrPayload[length + 1];
  cstrPayload[length] = 0;
  memcpy(cstrPayload, payload, sizeof(byte)*length);

#ifdef MQTT_DEBUG
  printf("MqttClient - Got message on topic: %s\n%s\n", topic, cstrPayload);
#endif

  if (this->variableUpdateCallback != NULL) {
    TokenIterator topicItr(topic, strlen(topic), '/');
    UrlTokenBindings urlTokens(*topicPatternTokens, topicItr);

    if (urlTokens.hasBinding(MQTT_TOPIC_VARIABLE_NAME_TOKEN)) {
      const char* variable = urlTokens.get(MQTT_TOPIC_VARIABLE_NAME_TOKEN);
      this->variableUpdateCallback(variable, cstrPayload);
    }
  }
}
