#include <GxEPD2.h>
#include <GxEPD2_GFX.h>
#include <GxEPD2_BW.h>
#include <GxEPD2_3C.h>
#include <DisplayTypeHelpers.h>

#include <map>
#include <utility>

template <class Display>
inline static GxEPD2_GFX* __gxepd2_build_bw_driver(const uint8_t dc, const uint8_t rst, const uint8_t busy, const uint8_t ssPin) {
  return new GxEPD2_BW<Display, Display::HEIGHT>(Display(SS, dc, rst, busy));
}

template <class Display>
inline static GxEPD2_GFX* __gxepd2_build_3c_driver(const uint8_t dc, const uint8_t rst, const uint8_t busy, const uint8_t ssPin) {
  return new GxEPD2_3C<Display, Display::HEIGHT>(Display(SS, dc, rst, busy));
}

const std::map<const char*, GxEPD2::Panel, cmp_str> DisplayTypeHelpers::PANELS_BY_NAME = {
  { "GDEP015OC1", GxEPD2::Panel::GDEP015OC1 },
  { "GDEW0154Z04", GxEPD2::Panel::GDEW0154Z04 },
  { "GDE0213B1", GxEPD2::Panel::GDE0213B1 },
  { "GDEH0213B72", GxEPD2::Panel::GDEH0213B72 },
  { "GDEH0213B73", GxEPD2::Panel::GDEH0213B73 },
  { "GDEW0213I5F", GxEPD2::Panel::GDEW0213I5F },
  { "GDEW0213Z16", GxEPD2::Panel::GDEW0213Z16 },
  { "GDEH029A1", GxEPD2::Panel::GDEH029A1 },
  { "GDEW029T5", GxEPD2::Panel::GDEW029T5 },
  { "GDEW029Z10", GxEPD2::Panel::GDEW029Z10 },
  { "GDEW026T0", GxEPD2::Panel::GDEW026T0 },
  { "GDEW027C44", GxEPD2::Panel::GDEW027C44 },
  { "GDEW027W3", GxEPD2::Panel::GDEW027W3 },
  { "GDEW0371W7", GxEPD2::Panel::GDEW0371W7 },
  { "GDEW042T2", GxEPD2::Panel::GDEW042T2 },
  { "GDEW042Z15", GxEPD2::Panel::GDEW042Z15 },
  { "GDEW0583T7", GxEPD2::Panel::GDEW0583T7 },
  { "GDEW0583Z21", GxEPD2::Panel::GDEW0583Z21 },
  { "ED060SCT", GxEPD2::Panel::ED060SCT },
  { "GDEW075T8", GxEPD2::Panel::GDEW075T8 },
  { "GDEW075T7", GxEPD2::Panel::GDEW075T7 },
  { "GDEW075Z09", GxEPD2::Panel::GDEW075Z09 },
  { "GDEW075Z08", GxEPD2::Panel::GDEW075Z08 }
};

const std::map<const GxEPD2::Panel, const char*> DisplayTypeHelpers::PANEL_DESCRIPTIONS = {
  { GxEPD2::Panel::GDEP015OC1, "1.54\" B/W" },
  { GxEPD2::Panel::GDEW0154Z04, "1.54\" B/W/R" },
  { GxEPD2::Panel::GDE0213B1, "2.13\" B/W" },
  { GxEPD2::Panel::GDEH0213B72, "2.13\" B/W" },
  { GxEPD2::Panel::GDEH0213B73, "2.13\" B/W" },
  { GxEPD2::Panel::GDEW0213I5F, "2.13\" B/W FLEX" },
  { GxEPD2::Panel::GDEW0213Z16, "2.13\" B/W/R" },
  { GxEPD2::Panel::GDEH029A1, "2.9\" B/W" },
  { GxEPD2::Panel::GDEW029T5, "2.9\" B/W" },
  { GxEPD2::Panel::GDEW029Z10, "2.9\" B/W/R" },
  { GxEPD2::Panel::GDEW026T0, "2.6\" B/W" },
  { GxEPD2::Panel::GDEW027C44, "2.7\" B/W/R" },
  { GxEPD2::Panel::GDEW027W3, "2.7\" B/W" },
  { GxEPD2::Panel::GDEW0371W7, "3.7\" B/W" },
  { GxEPD2::Panel::GDEW042T2, "4.2\" B/W" },
  { GxEPD2::Panel::GDEW042Z15, "4.2\" B/W/R" },
  { GxEPD2::Panel::GDEW0583T7, "5.83\" B/W" },
  { GxEPD2::Panel::GDEW0583Z21, "5.83\" B/W/R" },
  { GxEPD2::Panel::ED060SCT, "6\" B/W" },
  { GxEPD2::Panel::GDEW075T8, "7.5\" B/W" },
  { GxEPD2::Panel::GDEW075T7, "7.5\" B/W 800X480" },
  { GxEPD2::Panel::GDEW075Z09, "7.5\" B/W/R" },
  { GxEPD2::Panel::GDEW075Z08, "7.5\" B/W/R 800X480" }
};

const std::map<const GxEPD2::Panel, const char*> DisplayTypeHelpers::PANEL_COLOR_SUPPORT = {
  { GxEPD2::Panel::GDEP015OC1, "BW" },
  { GxEPD2::Panel::GDEW0154Z04, "BWR"},
  { GxEPD2::Panel::GDE0213B1, "BW"},
  { GxEPD2::Panel::GDEH0213B72, "BW"},
  { GxEPD2::Panel::GDEH0213B73, "BW"},
  { GxEPD2::Panel::GDEW0213I5F, "BW"},
  { GxEPD2::Panel::GDEW0213Z16, "BWR"},
  { GxEPD2::Panel::GDEH029A1, "BW"},
  { GxEPD2::Panel::GDEW029T5, "BW"},
  { GxEPD2::Panel::GDEW029Z10, "BWR"},
  { GxEPD2::Panel::GDEW026T0, "BW"},
  { GxEPD2::Panel::GDEW027C44, "BWR"},
  { GxEPD2::Panel::GDEW027W3, "BW"},
  { GxEPD2::Panel::GDEW0371W7, "BW"},
  { GxEPD2::Panel::GDEW042T2, "BW"},
  { GxEPD2::Panel::GDEW042Z15, "BWR"},
  { GxEPD2::Panel::GDEW0583T7, "BW"},
  { GxEPD2::Panel::GDEW0583Z21, "BWR"},
  { GxEPD2::Panel::ED060SCT, "BW"},
  { GxEPD2::Panel::GDEW075T8, "BW"},
  { GxEPD2::Panel::GDEW075T7, "BW"},
  { GxEPD2::Panel::GDEW075Z09, "BWR"},
  { GxEPD2::Panel::GDEW075Z08, "BWR"}
};

// Data generated with:
// ls src/{epd,epd3c}/*.h | xargs -I % bash -c 'grep -Eo "GxEPD2::[^;]+;" % | cut -d":" -f5 | tr -d "\n" && grep -Eo "(WIDTH|HEIGHT)[ ]*=[ ]*\d+" % | grep -Eo "[0-9]+" | tr "\n" "," && echo'
const std::map<const GxEPD2::Panel, std::pair<uint16_t, uint16_t>> DisplayTypeHelpers::PANEL_SIZES = {
  { GxEPD2::Panel::GDEP015OC1, std::make_pair<uint16_t, uint16_t>(200,200) },
  { GxEPD2::Panel::GDE0213B1, std::make_pair<uint16_t, uint16_t>(128,250) },
  { GxEPD2::Panel::GDEH0213B72, std::make_pair<uint16_t, uint16_t>(128,250) },
  { GxEPD2::Panel::GDEH0213B73, std::make_pair<uint16_t, uint16_t>(128,250) },
  { GxEPD2::Panel::GDEW0213I5F, std::make_pair<uint16_t, uint16_t>(104,212) },
  { GxEPD2::Panel::GDEW026T0, std::make_pair<uint16_t, uint16_t>(152,296) },
  { GxEPD2::Panel::GDEW027W3, std::make_pair<uint16_t, uint16_t>(176,264) },
  { GxEPD2::Panel::GDEH029A1, std::make_pair<uint16_t, uint16_t>(128,296) },
  { GxEPD2::Panel::GDEW029T5, std::make_pair<uint16_t, uint16_t>(128,296) },
  { GxEPD2::Panel::GDEW0371W7, std::make_pair<uint16_t, uint16_t>(240,416) },
  { GxEPD2::Panel::GDEW042T2, std::make_pair<uint16_t, uint16_t>(400,300) },
  { GxEPD2::Panel::GDEW0583T7, std::make_pair<uint16_t, uint16_t>(600,448) },
  { GxEPD2::Panel::GDEW075T8, std::make_pair<uint16_t, uint16_t>(640,384) },
  { GxEPD2::Panel::GDEW075T7, std::make_pair<uint16_t, uint16_t>(800,480) },
  { GxEPD2::Panel::GDEW0154Z04, std::make_pair<uint16_t, uint16_t>(200,200) },
  { GxEPD2::Panel::GDEW0213Z16, std::make_pair<uint16_t, uint16_t>(104,212) },
  { GxEPD2::Panel::GDEW027C44, std::make_pair<uint16_t, uint16_t>(176,264) },
  { GxEPD2::Panel::GDEW029Z10, std::make_pair<uint16_t, uint16_t>(128,296) },
  { GxEPD2::Panel::GDEW042Z15, std::make_pair<uint16_t, uint16_t>(400,300) },
  { GxEPD2::Panel::GDEW0583Z21, std::make_pair<uint16_t, uint16_t>(600,448) },
  { GxEPD2::Panel::GDEW075Z09, std::make_pair<uint16_t, uint16_t>(640,384) },
  { GxEPD2::Panel::GDEW075Z08, std::make_pair<uint16_t, uint16_t>(800,480) },
  { GxEPD2::Panel::ED060SCT, std::make_pair<uint16_t, uint16_t>(600, 800) },
};

const GxEPD2::Panel DisplayTypeHelpers::DEFAULT_PANEL = GxEPD2::Panel::GDEW042T2;

String DisplayTypeHelpers::displayTypeToString(GxEPD2::Panel type) {
  for (auto it = PANELS_BY_NAME.begin(); it != PANELS_BY_NAME.end(); ++it) {
    if (it->second == type) {
      return it->first;
    }
  }

  return "UNKNOWN";
}

GxEPD2::Panel DisplayTypeHelpers::stringToDisplayType(const String& displayType) {
  auto it = PANELS_BY_NAME.find(displayType.c_str());

  if (it == PANELS_BY_NAME.end()) {
    return DEFAULT_PANEL;
  } else {
    return it->second;
  }
}


bool DisplayTypeHelpers::is3Color(GxEPD2::Panel type) {
  switch (type) {
    case GxEPD2::Panel::GDEW0154Z04:
    case GxEPD2::Panel::GDEW0213Z16:
    case GxEPD2::Panel::GDEW029Z10:
    case GxEPD2::Panel::GDEW027C44:
    case GxEPD2::Panel::GDEW042Z15:
    case GxEPD2::Panel::GDEW0583Z21:
    case GxEPD2::Panel::GDEW075Z09:
    case GxEPD2::Panel::GDEW075Z08:
      return true;
    default:
      return false;
  }
}

GxEPD2_GFX* DisplayTypeHelpers::buildDisplay(GxEPD2::Panel type, uint8_t dc, uint8_t rst, uint8_t busy, uint8_t ss) {
  switch (type) {
    // black/white displays
    case GxEPD2::Panel::GDEP015OC1:
      return __gxepd2_build_bw_driver<GxEPD2_154>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDE0213B1:
      return __gxepd2_build_bw_driver<GxEPD2_213>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEH0213B72:
      return __gxepd2_build_bw_driver<GxEPD2_213_B72>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW0213I5F:
      return __gxepd2_build_bw_driver<GxEPD2_213_flex>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEH029A1:
      return __gxepd2_build_bw_driver<GxEPD2_290>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW029T5:
      return __gxepd2_build_bw_driver<GxEPD2_290_T5>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW027W3:
      return __gxepd2_build_bw_driver<GxEPD2_270>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW042T2:
      return __gxepd2_build_bw_driver<GxEPD2_420>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW0583T7:
      return __gxepd2_build_bw_driver<GxEPD2_583>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW075T8:
      return __gxepd2_build_bw_driver<GxEPD2_750>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEH0213B73:
      return __gxepd2_build_bw_driver<GxEPD2_213_B73>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW026T0:
      return __gxepd2_build_bw_driver<GxEPD2_260>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW0371W7:
      return __gxepd2_build_bw_driver<GxEPD2_371>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW075T7:
      return __gxepd2_build_bw_driver<GxEPD2_750_T7>(dc, rst, busy, ss);

    // Color displays
    case GxEPD2::Panel::ED060SCT:
      return __gxepd2_build_3c_driver<GxEPD2_it60>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW0154Z04:
      return __gxepd2_build_3c_driver<GxEPD2_154c>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW0213Z16:
      return __gxepd2_build_3c_driver<GxEPD2_213c>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW029Z10:
      return __gxepd2_build_3c_driver<GxEPD2_290c>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW027C44:
      return __gxepd2_build_3c_driver<GxEPD2_270c>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW042Z15:
      return __gxepd2_build_3c_driver<GxEPD2_420c>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW0583Z21:
      return __gxepd2_build_3c_driver<GxEPD2_583c>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW075Z09:
      return __gxepd2_build_3c_driver<GxEPD2_750c>(dc, rst, busy, ss);
    case GxEPD2::Panel::GDEW075Z08:
      return __gxepd2_build_3c_driver<GxEPD2_750c_Z08>(dc, rst, busy, ss);
    default:
      Serial.printf_P(PSTR("Unsupported display type, using default.  Provided display: %d\n"), static_cast<size_t>(type));
      return buildDisplay(DisplayTypeHelpers::DEFAULT_PANEL, dc, rst, busy, ss);
  }
}