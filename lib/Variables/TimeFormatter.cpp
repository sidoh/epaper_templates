#include <TimeLib.h>
#include <VariableFormatters.h>
#include <Timezones.h>
#include <time.h>
#include <ArduinoJson.h>

static const char FORMAT_ARG_NAME[] = "format";
static const char TIMEZONE_ARG_NAME[] = "timezone";

const char TimeVariableFormatter::DEFAULT_TIME_FORMAT[] = "%H:%M";

TimeVariableFormatter::TimeVariableFormatter(const String& timeFormat, Timezone& timezone)
  : timeFormat(timeFormat),
    timezone(timezone)
{ }

std::shared_ptr<const TimeVariableFormatter> TimeVariableFormatter::build(JsonObject args) {
  Timezone& tz = Timezones.getTimezone(args[TIMEZONE_ARG_NAME]);
  String timeFormat;

  if (args.containsKey(FORMAT_ARG_NAME)) {
    timeFormat = args[FORMAT_ARG_NAME].as<const char*>();
  } else {
    timeFormat = DEFAULT_TIME_FORMAT;
  }

  return std::shared_ptr<const TimeVariableFormatter>(new TimeVariableFormatter(timeFormat, tz));
}

String TimeVariableFormatter::format(const String &value) const {
  time_t parsedTime = value.toInt();
  parsedTime = timezone.toLocal(parsedTime);

  char buffer[100];
  memset(buffer, 0, sizeof(buffer));
  struct tm* tminfo = localtime(&parsedTime);

  strftime(buffer, sizeof(buffer), timeFormat.c_str(), tminfo);

  return buffer;
}
