#include <VariableFormatters.h>

RatioVariableFormatter::RatioVariableFormatter(float baseValue)
    : baseValue(baseValue) {}

String RatioVariableFormatter::format(const String& value) const {
  if (baseValue == 0.0) {
    return "0";
  } else {
    float fValue = value.toFloat();
    return String(fValue/baseValue);
  }
}