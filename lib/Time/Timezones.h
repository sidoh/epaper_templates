#include <map>
#include <Timezone.h>

#ifndef _TIMEZONES_H
#define _TIMEZONES_H

class TimezonesClass {
public:
  TimezonesClass();
  ~TimezonesClass();

  static const char* DEFAULT_TIMEZONE_NAME;
  static Timezone& DEFAULT_TIMEZONE;

  bool hasTimezone(const String& tzName);
  Timezone& getTimezone(const String& tzName);
  String getTimezoneName(Timezone& tz);
  void setDefaultTimezone(Timezone& tz);

private:
  std::map<String, Timezone*> timezonesByName;
  Timezone* defaultTimezone;
};

extern TimezonesClass Timezones;

#endif
