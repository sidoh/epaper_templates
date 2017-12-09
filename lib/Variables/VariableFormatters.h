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

  static std::shared_ptr<const VariableFormatter> buildFormatter(const JsonObject& args);
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
  static std::shared_ptr<const TimeVariableFormatter> build(const JsonObject& args);

protected:
  String timeFormat;
  Timezone& timezone;
};

class CasesVariableFormatter : public VariableFormatter {
public:
  CasesVariableFormatter(const JsonObject& args);

  virtual String format(const String& value) const;

protected:
  std::map<String, String> cases;
  String defaultValue;
  String prefix;
};

#endif
