#include <Timezones.h>

// https://github.com/JChristensen/Timezone/blob/master/examples/WorldClock/WorldClock.ino

// Australia Eastern Time Zone (Sydney, Melbourne)
TimeChangeRule aEDT = {"AEDT", First, Sun, Oct, 2, 660};    // UTC + 11 hours
TimeChangeRule aEST = {"AEST", First, Sun, Apr, 3, 600};    // UTC + 10 hours
Timezone ausET(aEDT, aEST);

// Moscow Standard Time (MSK, does not observe DST)
TimeChangeRule msk = {"MSK", Last, Sun, Mar, 1, 180};
Timezone tzMSK(msk);

// Central European Time (Frankfurt, Paris)
TimeChangeRule CEST = {"CEST", Last, Sun, Mar, 2, 120};     // Central European Summer Time
TimeChangeRule CET = {"CET ", Last, Sun, Oct, 3, 60};       // Central European Standard Time
Timezone CE(CEST, CET);

// United Kingdom (London, Belfast)
TimeChangeRule BST = {"BST", Last, Sun, Mar, 1, 60};        // British Summer Time
TimeChangeRule GMT = {"GMT", Last, Sun, Oct, 2, 0};         // Standard Time
Timezone UK(BST, GMT);

// UTC
TimeChangeRule utcRule = {"UTC", Last, Sun, Mar, 1, 0};     // UTC
Timezone UTC(utcRule);

// US Eastern Time Zone (New York, Detroit)
TimeChangeRule usEDT = {"EDT", Second, Sun, Mar, 2, -240};  // Eastern Daylight Time = UTC - 4 hours
TimeChangeRule usEST = {"EST", First, Sun, Nov, 2, -300};   // Eastern Standard Time = UTC - 5 hours
Timezone usET(usEDT, usEST);

// US Central Time Zone (Chicago, Houston)
TimeChangeRule usCDT = {"CDT", Second, Sun, Mar, 2, -300};
TimeChangeRule usCST = {"CST", First, Sun, Nov, 2, -360};
Timezone usCT(usCDT, usCST);

// US Mountain Time Zone (Denver, Salt Lake City)
TimeChangeRule usMDT = {"MDT", Second, Sun, Mar, 2, -360};
TimeChangeRule usMST = {"MST", First, Sun, Nov, 2, -420};
Timezone usMT(usMDT, usMST);

// Arizona is US Mountain Time Zone but does not use DST
Timezone usAZ(usMST);

// US Pacific Time Zone (Las Vegas, Los Angeles)
TimeChangeRule usPDT = {"PDT", Second, Sun, Mar, 2, -420};
TimeChangeRule usPST = {"PST", First, Sun, Nov, 2, -480};
Timezone usPT(usPDT, usPST);

Timezone& TimezonesClass::DEFAULT_TIMEZONE = usPT;
const char* TimezonesClass::DEFAULT_TIMEZONE_NAME = "PT";

TimezonesClass::TimezonesClass() {
  timezonesByName["AUSET"] = &ausET;
  timezonesByName["MSK"] = &tzMSK;
  timezonesByName["CET"] = &CE;
  timezonesByName["UK"] = &UK;
  timezonesByName["UTC"] = &UTC;
  timezonesByName["ET"] = &usET;
  timezonesByName["CT"] = &usCT;
  timezonesByName["MT"] = &usMT;
  timezonesByName["AZ"] = &usAZ;
  timezonesByName["PT"] = &usPT;

  this->defaultTimezone = &DEFAULT_TIMEZONE;
}

TimezonesClass::~TimezonesClass() { }

bool TimezonesClass::hasTimezone(const String& tzName) {
  return timezonesByName.count(tzName) > 0;
}

Timezone& TimezonesClass::getTimezone(const String& tzName) {
  if (hasTimezone(tzName)) {
    return *timezonesByName[tzName];
  }

  Serial.println(F("WARN - couldn't find specified timezone.  Returning default."));

  return *this->defaultTimezone;
}

String TimezonesClass::getTimezoneName(Timezone &tz) {
  for (std::map<String, Timezone*>::iterator itr = timezonesByName.begin(); itr != timezonesByName.end(); ++itr) {
    if (itr->second == &tz) {
      return itr->first;
    }
  }
  return "";
}

void TimezonesClass::setDefaultTimezone(Timezone& tz) {
  this->defaultTimezone = &tz;
}

TimezonesClass Timezones;
