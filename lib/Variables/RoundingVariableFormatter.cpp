#include <VariableFormatters.h>

RoundingVariableFormatter::RoundingVariableFormatter(uint8_t digits)
  : digits(digits)
{ }

String RoundingVariableFormatter::format(const String& value) const {
  char format[20];
  sprintf(format, "%%.%df", digits);
  char formattedValue[value.length() + 1];
  sprintf(formattedValue, format, value.toFloat());

  return formattedValue;
}