#include <VariableFormatters.h>

CasesVariableFormatter::CasesVariableFormatter(const JsonObject& args) {
  JsonObject& cases = args["cases"];
  for (JsonObject::iterator itr = cases.begin(); itr != cases.end(); ++itr) {
    this->cases[itr->key] = itr->value.as<const char*>();
  }

  this->defaultValue = args.get<const char*>("default");
  this->prefix = args.get<const char*>("prefix");
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
