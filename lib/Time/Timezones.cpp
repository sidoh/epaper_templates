#include <Timezones.h>

//United Kingdom (London, Belfast)
static TimeChangeRule BST = {"BST", Last, Sun, Mar, 1, 60};        //British Summer Time
static TimeChangeRule GMT = {"GMT", Last, Sun, Oct, 2, 0};         //Standard Time
static Timezone UK(BST, GMT);

//US Eastern Time Zone (New York, Detroit)
static TimeChangeRule usEDT = {"EDT", Second, Sun, Mar, 2, -240};  //Eastern Daylight Time = UTC - 4 hours
static TimeChangeRule usEST = {"EST", First, Sun, Nov, 2, -300};   //Eastern Standard Time = UTC - 5 hours
static Timezone usET(usEDT, usEST);

//US Central Time Zone (Chicago, Houston)
static TimeChangeRule usCDT = {"CDT", Second, dowSunday, Mar, 2, -300};
static TimeChangeRule usCST = {"CST", First, dowSunday, Nov, 2, -360};
static Timezone usCT(usCDT, usCST);

//US Mountain Time Zone (Denver, Salt Lake City)
static TimeChangeRule usMDT = {"MDT", Second, dowSunday, Mar, 2, -360};
static TimeChangeRule usMST = {"MST", First, dowSunday, Nov, 2, -420};
static Timezone usMT(usMDT, usMST);

//Arizona is US Mountain Time Zone but does not use DST
static Timezone usAZ(usMST, usMST);

//US Pacific Time Zone (Las Vegas, Los Angeles)
static TimeChangeRule usPDT = {"PDT", Second, dowSunday, Mar, 2, -420};
static TimeChangeRule usPST = {"PST", First, dowSunday, Nov, 2, -480};
static Timezone usPT(usPDT, usPST);

Timezone& TimezonesClass::DEFAULT_TIMEZONE = usPT;
const char* TimezonesClass::DEFAULT_TIMEZONE_NAME = "PT";

TimezonesClass::TimezonesClass() {
  timezonesByName["UK"] = &UK;
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
