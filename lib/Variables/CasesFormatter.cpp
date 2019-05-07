#include <VariableFormatters.h>

CasesVariableFormatter::CasesVariableFormatter(JsonObject args) {
  JsonObject cases = args["cases"];
  for (JsonObject::iterator itr = cases.begin(); itr != cases.end(); ++itr) {
    this->cases[itr->key().c_str()] = itr->value().as<String>();
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
