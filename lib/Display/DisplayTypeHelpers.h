#pragma once

#include <GxEPD2.h>
#include <GxEPD2_GFX.h>

#include <memory>

class DisplayTypeHelpers {
public:

  static String displayTypeToString(GxEPD2::Panel type);
  static GxEPD2::Panel stringToDisplayType(const String& displayType);
  static bool is3Color(GxEPD2::Panel type);

  static GxEPD2_GFX* buildDisplay(GxEPD2::Panel type, uint8_t dcPin, uint8_t rstPin, uint8_t busyPin);

  static const GxEPD2::Panel DEFAULT_PANEL;
  static const char* DISPLAY_NAMES[];
};