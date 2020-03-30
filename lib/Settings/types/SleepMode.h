enum class SleepMode {
  ALWAYS_ON = 0,
  DEEP_SLEEP = 1
};

#pragma once

class SleepModeHelpers {
public:
  static const char* SLEEP_MODE_NAMES[];
  static const SleepMode DEFAULT_SLEEP_MODE = SleepMode::ALWAYS_ON;

  static const char* getName(const SleepMode sleepMode);
  static SleepMode parseName(const char* name);
};