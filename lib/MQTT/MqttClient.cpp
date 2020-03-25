#include <MqttClient.h>
#include <ArduinoJson.h>
#include <Settings.h>
#include <TokenIterator.h>
#include <UrlTokenBindings.h>
#include <functional>
#include <map>

using namespace std::placeholders;

#if defined(ESP32)
// Structure borrowed from:
// https://github.com/nkolban/esp32-snippets/blob/master/cpp_utils/FreeRTOSTimer.cpp
static std::map<void *, MqttClient *> timersMap;

void MqttClient::internalCallback(TimerHandle_t xTimer) {
	MqttClient* client = timersMap.at(xTimer);
	client->connect();
}
#elif defined(ESP8266)
void MqttClient::internalCallback(MqttClient* client) {
  client->connect();
}
#endif

MqttClient::MqttClient(
  String domain,
  uint16_t port,
  String variableTopicPattern,
  String username,
  String password
) : port(port)
  , domain(domain)
  , username(username)
  , password(password)
  , lastConnectAttempt(0)
  , variableUpdateCallback(NULL)
  , topicPattern(variableTopicPattern)
{
  this->topicPatternBuffer = new char[topicPattern.length() + 1];
  strcpy(this->topicPatternBuffer, this->topicPattern.c_str());
  this->topicPatternTokens = new TokenIterator(this->topicPatternBuffer, topicPattern.length(), '/');
}

MqttClient::~MqttClient() {
  delete this->topicPatternTokens;
  delete this->topicPatternBuffer;

  mqttClient.disconnect();

  #if defined(ESP32)
  xTimerDelete(reconnectTimer, portMAX_DELAY);
  timersMap.erase(reconnectTimer);
  #endif
}

void MqttClient::onVariableUpdate(TVariableUpdateFn fn) {
  this->variableUpdateCallback = fn;
}

void MqttClient::begin() {
  #if defined(ESP32)
  reconnectTimer = xTimerCreate(
    "mqttTimer",
    pdMS_TO_TICKS(2000),
    pdFALSE,
    (void*)0,
    internalCallback
  );
  timersMap.insert(std::make_pair(reconnectTimer, this));
  #endif

  // Setup callbacks
  mqttClient.onConnect(std::bind(&MqttClient::connectCallback, this, _1));
  mqttClient.onDisconnect(std::bind(&MqttClient::disconnectCallback, this, _1));
  mqttClient.onMessage(std::bind(&MqttClient::messageCallback, this, _1, _2, _3, _4, _5, _6));
  mqttClient.setKeepAlive(60);

  // Configure client
  sprintf_P(this->clientName, PSTR("epaper-display-%u"), ESP_CHIP_ID());
  mqttClient.setClientId(this->clientName);

  if (this->username.length() > 0) {
    mqttClient.setCredentials(this->username.c_str(), this->password.c_str());
  }
  mqttClient.setServer(this->domain.c_str(), this->port);

  connect();
}

void MqttClient::connect() {
  #ifdef MQTT_DEBUG
    Serial.println(F("MqttClient - connecting"));
  #endif

  mqttClient.connect();
}

void MqttClient::disconnectCallback(AsyncMqttClientDisconnectReason reason) {
  #ifdef MQTT_DEBUG
    Serial.println(F("MqttClient - disconnected"));
  #endif

  #if defined(ESP8266)
  reconnectTimer.once(2, internalCallback, this);
  #elif defined(ESP32)
  xTimerStart(reconnectTimer, 0);
  #endif
}

void MqttClient::connectCallback(bool sessionPresent) {
  String topic = this->topicPattern;
  topic.replace(String(":") + MQTT_TOPIC_VARIABLE_NAME_TOKEN, "+");

  #ifdef MQTT_DEBUG
    printf_P(PSTR("MqttClient - subscribing to topic: %s\n"), topic.c_str());
  #endif

  mqttClient.subscribe(topic.c_str(), 0);
}

void MqttClient::messageCallback(
  char* topic,
  char* payload,
  AsyncMqttClientMessageProperties properties,
  size_t len,
  size_t index,
  size_t total
) {
  if (index > 0) {
    Serial.println(F("MqttClient - WARNING: got unsupported second call to messageCallback"));
    return;
  }

  char payloadCopy[len + 1];
  memcpy(payloadCopy, payload, len);
  payloadCopy[len] = 0;

  #ifdef MQTT_DEBUG
    Serial.printf("MqttClient - Got message on topic: %s\n%s\n", topic, payloadCopy);
  #endif

  if (this->variableUpdateCallback != NULL) {
    TokenIterator topicItr(topic, strlen(topic), '/');
    UrlTokenBindings urlTokens(*topicPatternTokens, topicItr);

    if (urlTokens.hasBinding(MQTT_TOPIC_VARIABLE_NAME_TOKEN)) {
      const char* variable = urlTokens.get(MQTT_TOPIC_VARIABLE_NAME_TOKEN);

      this->variableUpdateCallback(variable, payloadCopy);
    }
  }
}
