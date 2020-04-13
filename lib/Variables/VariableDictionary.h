#include <EnvironmentConfig.h>
#include <ArduinoJson.h>
#include <KeyValueDatabase.h>
#include <map>
#include <set>

#ifndef VARIABLE_DICTIONARY
#define VARIABLE_DICTIONARY

class VariableDictionary {
public:
  static const char FILENAME[];
  static const size_t MAX_KEY_SIZE = 255;

  VariableDictionary();

  String get(const String& key);
  void set(const String& key, const String& value);
  void erase(const String& key);
  void clear();

  void save();
  void load();
  void loop();

private:
  KeyValueDatabase db;

  static const std::set<String> TRANSIENT_VARIABLES;
  std::map<String, String> transientVariables;
};

#endif