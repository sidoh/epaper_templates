#include <types/SleepMode.h>
#include <stddef.h>
#include <string.h>

const char* SleepModeHelpers::SLEEP_MODE_NAMES[] = {
  "ALWAYS_ON",
  "DEEP_SLEEP"
};

const char* SleepModeHelpers::getName(const SleepMode sleepMode) {
  return SLEEP_MODE_NAMES[static_cast<size_t>(sleepMode)];
}

SleepMode SleepModeHelpers::parseName(const char* name) {
  size_t index = 0;
  for (const char* storedName : SleepModeHelpers::SLEEP_MODE_NAMES) {
    if (0 == strcmp(name, storedName)) {
      return static_cast<SleepMode>(index);
    }
    index++;
  }

  return SleepModeHelpers::DEFAULT_SLEEP_MODE;
}