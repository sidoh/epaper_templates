#include <FS.h>
#include <VariableDictionary.h>

static const char DEFAULT_VALUE[] = "";
const char VariableDictionary::FILENAME[] = "/variables.json";

VariableDictionary::VariableDictionary()
  : dict(&buffer.createObject())
{ }

void VariableDictionary::load() {
  buffer.clear();

  File f = SPIFFS.open(FILENAME, "r");
  dict = &buffer.parseObject(f);
  f.close();
}

void VariableDictionary::save() {
  File f = SPIFFS.open(FILENAME, "w");
  dict->printTo(f);
  f.close();
}

void VariableDictionary::registerVariable(const String& key) {
  if (! containsKey(key)) {
    set(key, "");
  }
}

bool VariableDictionary::containsKey(const String &key) {
  return dict->containsKey(key);
}

void VariableDictionary::set(const String &key, const String &value) {
  dict->set(key, value);
  save();
}

String VariableDictionary::get(const String &key) {
  if (dict->containsKey(key)) {
    return dict->get<const char*>(key);
  } else {
    return DEFAULT_VALUE;
  }
}
