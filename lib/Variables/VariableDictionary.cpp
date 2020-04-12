#include <FS.h>
#include <VariableDictionary.h>

const std::set<String> VariableDictionary::TRANSIENT_VARIABLES = {
  "timestamp"
};

static const size_t MAX_VALUE_SIZE = 255;
static const char DEFAULT_VALUE[] = "";
const char VariableDictionary::FILENAME[] = "/variables.db";

VariableDictionary::VariableDictionary()
{ }

void VariableDictionary::set(const String& key, const String& value) {
  if (TRANSIENT_VARIABLES.find(key) != TRANSIENT_VARIABLES.end()) {
    transientVariables[key] = value;
  } else {
    db.set(key.c_str(), key.length(), value.c_str(), value.length());
  }
}

void VariableDictionary::erase(const String &key) {
  db.erase(key.c_str(), key.length());
}

String VariableDictionary::get(const String &key) {
  char valueBuffer[MAX_VALUE_SIZE];
  auto tvLookup = transientVariables.find(key);

  if (tvLookup != transientVariables.end()) {
    return tvLookup->second;
  } else if (db.get(key.c_str(), key.length(), valueBuffer, MAX_VALUE_SIZE)) {
    return valueBuffer;
  } else {
    return DEFAULT_VALUE;
  }
}

void VariableDictionary::loop() {
}

void VariableDictionary::load() {
  // Create the database if it doesn't exist.
  // We specifically need r+ mode to enable both random reads and random writes.
  // r+ fails if the file doesn't already exist.
  if (! SPIFFS.exists(VariableDictionary::FILENAME)) {
    SPIFFS.open(VariableDictionary::FILENAME, "w").close();
  }

  db.open(SPIFFS.open(VariableDictionary::FILENAME, "r+"));
}

void VariableDictionary::save() {
}