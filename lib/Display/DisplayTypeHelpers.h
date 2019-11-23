#pragma once

#include <GxEPD2.h>
#include <GxEPD2_GFX.h>
#include <CharComparator.h>

#include <memory>
#include <map>
#include <utility>

class DisplayTypeHelpers {
public:

  static String displayTypeToString(GxEPD2::Panel type);
  static GxEPD2::Panel stringToDisplayType(const String& displayType);
  static bool is3Color(GxEPD2::Panel type);

  static GxEPD2_GFX* buildDisplay(GxEPD2::Panel type, uint8_t dcPin, uint8_t rstPin, uint8_t busyPin);

  static const GxEPD2::Panel DEFAULT_PANEL;
  static const char* DISPLAY_NAMES[];

  static const std::map<const GxEPD2::Panel, std::pair<uint16_t, uint16_t>> PANEL_SIZES;
  static const std::map<const char*, GxEPD2::Panel, cmp_str> PANELS_BY_NAME;
};