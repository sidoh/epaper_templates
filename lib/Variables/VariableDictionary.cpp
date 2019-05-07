#include <FS.h>
#include <VariableDictionary.h>

static const char DEFAULT_VALUE[] = "";
const char VariableDictionary::FILENAME[] = "/variables.json";

VariableDictionary::VariableDictionary()
{ }

void VariableDictionary::load() {
  this->vars.clear();

  File f = SPIFFS.open(FILENAME, "r");
  DynamicJsonDocument buffer(2048);
  deserializeJson(buffer, f);
  JsonObject obj = buffer.as<JsonObject>();
  f.close();

  if (obj.isNull()) {
    Serial.println(F("WARN - VariableDictionary: couldn't parse variables file"));
    return;
  }

  for (JsonObject::iterator itr = obj.begin(); itr != obj.end(); ++itr) {
    this->vars[itr->key().c_str()] = itr->value().as<const char*>();
  }
}

void VariableDictionary::save() {
  // For conversion to json
  DynamicJsonDocument obj(2048);

  for (std::map<String, String>::iterator itr = vars.begin(); itr != vars.end(); ++itr) {
    obj[itr->first] = itr->second;
  }

  char tmpName[50];
  sprintf(tmpName, "%s_tmp", FILENAME);
  File f = SPIFFS.open(tmpName, "w");
  serializeJson(obj, f);
  f.close();

  SPIFFS.remove(FILENAME);

  if (!SPIFFS.rename(tmpName, FILENAME)) {
    Serial.println(F("VariableDictionary - WARN: could not move tmp file over"));
  }
}

void VariableDictionary::registerVariable(const String& key) {
  if (! containsKey(key)) {
    set(key, "");
  }
}

bool VariableDictionary::containsKey(const String &key) {
  return this->vars.count(key) > 0;
}

void VariableDictionary::set(const String &key, const String &value) {
  this->vars[key] = value;

  // Don't save timestamp, as it's updated every second
  if (key != "timestamp") {
    save();
  }
}

String VariableDictionary::get(const String &key) {
  if (containsKey(key)) {
    return this->vars[key];
  } else {
    return DEFAULT_VALUE;
  }
}
