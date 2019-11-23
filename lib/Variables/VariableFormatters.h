#include <ArduinoJson.h>
#include <Timezone.h>
#include <memory>
#include <map>

#ifndef _VARIABLE_FORMATTER_H
#define _VARIABLE_FORMATTER_H

class VariableFormatter {
public:
  virtual String format(const String& value) const = 0;

  ~VariableFormatter() { }
};

class IdentityVariableFormatter : public VariableFormatter {
public:
  virtual String format(const String& value) const;
};

class TimeVariableFormatter : public VariableFormatter {
public:
  static const char DEFAULT_TIME_FORMAT[];

  TimeVariableFormatter(const String& timeFormat, Timezone& timezone);

  virtual String format(const String& value) const;
  static std::shared_ptr<const TimeVariableFormatter> build(JsonObject args);

protected:
  String timeFormat;
  Timezone& timezone;
};

class CasesVariableFormatter : public VariableFormatter {
public:
  CasesVariableFormatter(JsonObject args);

  virtual String format(const String& value) const;

protected:
  std::map<String, String> cases;
  String defaultValue;
  String prefix;
};

class RoundingVariableFormatter : public VariableFormatter {
public:
  RoundingVariableFormatter(uint8_t digits);

  virtual String format(const String& value) const;
private:
  uint8_t digits;
};

class VariableFormatterFactory {
public:
  VariableFormatterFactory(JsonObject referenceFormatters);

  std::shared_ptr<const VariableFormatter> create(JsonObject spec);

private:
  std::map<String, std::shared_ptr<const VariableFormatter>> refFormatters;

  std::shared_ptr<const VariableFormatter> getReference(String refKey, bool allowReference);
  std::shared_ptr<const VariableFormatter> _createInternal(JsonObject spec, bool allowReference);
  std::shared_ptr<const VariableFormatter> defaultFormatter;
};


#endif
