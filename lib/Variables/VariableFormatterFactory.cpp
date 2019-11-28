#include <VariableFormatters.h>

VariableFormatterFactory::VariableFormatterFactory(
    const JsonVariant& referenceFormatters)
    : defaultFormatter(new IdentityVariableFormatter()) {
  if (referenceFormatters.is<JsonObject>()) {
    for (JsonPair kv : referenceFormatters.as<JsonObject>()) {
      String key = kv.key().c_str();
      JsonObject formatterSpec = kv.value().as<JsonObject>();

      refFormatters[key] = _createInternal(formatterSpec, false);
    }
  } else if (referenceFormatters.is<JsonArray>()) {
    for (JsonObject formatter : referenceFormatters.as<JsonArray>()) {
      String key = formatter["name"];
      Serial.printf_P(PSTR("formatter key = %s\n"), key.c_str());

      refFormatters[key] = _createInternal(formatter["formatter"], false);
    }
  } else {
    Serial.println(
        F("WARNING: formatter definition block either missing or is of invalid "
          "type."));
  }
}

std::shared_ptr<const VariableFormatter> VariableFormatterFactory::create(
    JsonObject spec) {
  return _createInternal(spec, true);
}

std::shared_ptr<const VariableFormatter> VariableFormatterFactory::getReference(
    String refKey, bool allowReference) {
  if (!allowReference) {
    Serial.println(
        F("WARNING: Tried to reference a formatter when references were "
          "disallowed (probably because it's a reference to begin with!)"));
    return defaultFormatter;
  }

  if (refFormatters.count(refKey) > 0) {
    return refFormatters[refKey];
  } else {
    Serial.printf_P(PSTR("WARNING: undefined reference to formatter `%s'\n"),
        refKey.c_str());
    return defaultFormatter;
  }
}

std::shared_ptr<const VariableFormatter>
VariableFormatterFactory::_createInternal(
    JsonObject spec, bool allowReference) {
  JsonVariant formatterSpec = spec;

  if (formatterSpec.containsKey("formatter")) {
    formatterSpec = spec["formatter"];
  }

  String formatterDef;
  JsonObject formatterArgs;

  // old v1 spec where formatter is defined inline with the spec
  // and defines references with an anchor prefix
  if (formatterSpec.is<String>()) {
    formatterDef = formatterSpec.as<const char*>();
    formatterArgs = spec["args"];

    // Handle references first (code is clearer this way)
    if (formatterDef.startsWith("&")) {
      String refName = formatterDef.substring(1);
      return getReference(refName, allowReference);
    }
  } else if (formatterSpec.is<JsonObject>()) {
    JsonObject formatterSpecObj = formatterSpec;
    formatterDef = formatterSpecObj["type"].as<const char*>();

    if (formatterDef.equalsIgnoreCase("ref")) {
      String refName = formatterSpecObj["ref"];
      return getReference(refName, allowReference);
    }

    formatterArgs = formatterSpecObj["args"];
  }

  if (formatterDef.equalsIgnoreCase("time")) {
    return TimeVariableFormatter::build(formatterArgs);
  } else if (formatterDef.equalsIgnoreCase("cases")) {
    return std::make_shared<CasesVariableFormatter>(formatterArgs);
  } else if (formatterDef.equalsIgnoreCase("round")) {
    uint8_t numDigits = 0;
    if (formatterArgs.containsKey("digits")) {
      numDigits = formatterArgs["digits"];
    }

    return std::make_shared<RoundingVariableFormatter>(numDigits);
  } else if (formatterDef.equalsIgnoreCase("ratio")) {
    float base = 0.0;
    if (formatterArgs.containsKey("base")) {
      base = formatterArgs["base"];
    }

    return std::make_shared<RatioVariableFormatter>(base);
  } else {
    return defaultFormatter;
  }
}