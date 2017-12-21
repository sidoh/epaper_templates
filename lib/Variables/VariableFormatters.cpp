#include <Arduino.h>
#include <VariableFormatters.h>

String IdentityVariableFormatter::format(const String& value) const {
  return value;
}
