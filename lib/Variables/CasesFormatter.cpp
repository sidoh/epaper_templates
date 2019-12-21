#include <VariableFormatters.h>

CasesVariableFormatter::CasesVariableFormatter(JsonObject args) {
  JsonVariant cases = args["cases"];

  if (cases.is<JsonObject>()) {
    for (JsonPair kv : cases.as<JsonObject>()) {
      this->cases[kv.key().c_str()] = kv.value().as<String>();
    }
  } else if (cases.is<JsonArray>()) {
    for (JsonVariant value : cases.as<JsonArray>()) {
      JsonObject _value = value.as<JsonObject>();
      const char* mapFrom = _value["key"].as<const char*>();
      const char* mapTo = _value["value"].as<const char*>();

      this->cases[mapFrom] = mapTo;
    }
  } else {
    Serial.println(
        F("CasesVariableFormatter: ERROR - unexpected type for \"cases\" arg"));
  }

  this->defaultValue = args["default"].as<const char*>();
  this->prefix = args["prefix"].as<const char*>();
}

String CasesVariableFormatter::format(const String& value) const {
  String result = prefix;

  if (cases.count(value) > 0) {
    result += cases.at(value);
  } else {
    result += defaultValue;
  }

  return result;
}
