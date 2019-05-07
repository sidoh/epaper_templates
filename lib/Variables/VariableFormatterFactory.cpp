#include <VariableFormatters.h>

VariableFormatterFactory::VariableFormatterFactory(JsonObject referenceFormatters)
  : referenceFormatters(referenceFormatters),
    defaultFormatter(new IdentityVariableFormatter())
{ }

std::shared_ptr<const VariableFormatter> VariableFormatterFactory::create(JsonObject spec) {
  return _createInternal(spec, true);
}

std::shared_ptr<const VariableFormatter> VariableFormatterFactory::_createInternal(JsonObject spec, bool allowReference) {
  String formatter = spec["formatter"];

  // Handle references first (code is clearer this way)
  if (formatter.startsWith("&")) {
    if (! allowReference) {
      Serial.println(F("WARNING: Tried to reference a formatter when references were disallowed (probably because it's a reference to begin with!)"));
      return defaultFormatter;
    }

    String refName = formatter.substring(1);

    if (!referenceFormatters.isNull() && referenceFormatters.containsKey(refName)) {
      if (internedFormatters.count(refName) > 0) {
        return internedFormatters[refName];
      } else {
        // Don't allow 2nd order references
        std::shared_ptr<const VariableFormatter> builtFormatter = _createInternal(referenceFormatters[refName], false);
        internedFormatters[refName] = builtFormatter;
        return builtFormatter;
      }
    } else {
      Serial.print(F("WARNING: undefined reference to formatter `"));
      Serial.print(refName);
      Serial.println(F("'"));

      return defaultFormatter;
    }
  }

  if (formatter.equalsIgnoreCase("time")) {
    return TimeVariableFormatter::build(spec["args"]);
  } else if (formatter.equalsIgnoreCase("cases")) {
    return std::shared_ptr<const VariableFormatter>(new CasesVariableFormatter(spec["args"].as<JsonObject>()));
  } else if (formatter.equalsIgnoreCase("round")) {
    uint8_t numDigits = 0;
    if (spec.containsKey("args")) {
      JsonObject objArgs = spec["args"];
      if (objArgs.containsKey("digits")) {
        numDigits = objArgs["digits"];
      }
    }
    return std::shared_ptr<const VariableFormatter>(new RoundingVariableFormatter(numDigits));
  } else {
    return std::shared_ptr<const VariableFormatter>(new IdentityVariableFormatter());
  }
}