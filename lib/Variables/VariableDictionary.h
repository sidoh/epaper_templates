#include <EnvironmentConfig.h>
#include <ArduinoJson.h>
#include <map>

#ifndef VARIABLE_DICTIONARY
#define VARIABLE_DICTIONARY

class VariableDictionary {
public:
  static const char FILENAME[];

  VariableDictionary();

  String get(const String& key);
  void set(const String& key, const String& value);
  void registerVariable(const String& key);
  bool containsKey(const String& key);

  void save();
  void load();

private:
  std::map<String, String> vars;
};

#endif
