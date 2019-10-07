#include <GxEPD2.h>
#include <GxEPD2_GFX.h>
#include <GxEPD2_BW.h>
#include <GxEPD2_3C.h>
#include <DisplayTypeHelpers.h>
#include <CharComparator.h>

#include <map>

template <class Display>
inline static GxEPD2_GFX* __gxepd2_build_bw_driver(const uint8_t dc, const uint8_t rst, const uint8_t busy) {
  return new GxEPD2_BW<Display, Display::HEIGHT>(Display(SS, dc, rst, busy));
}

template <class Display>
inline static GxEPD2_GFX* __gxepd2_build_3c_driver(const uint8_t dc, const uint8_t rst, const uint8_t busy) {
  return new GxEPD2_3C<Display, Display::HEIGHT>(Display(SS, dc, rst, busy));
}

static const std::map<const char*, GxEPD2::Panel, cmp_str> PANELS_BY_NAME = {
  { "GDEP015OC1", GxEPD2::Panel::GDEP015OC1 },
  { "GDE0213B1", GxEPD2::Panel::GDE0213B1 },
  { "GDEH0213B72", GxEPD2::Panel::GDEH0213B72 },
  { "GDEH0213B73", GxEPD2::Panel::GDEH0213B73 },
  { "GDEW0213I5F", GxEPD2::Panel::GDEW0213I5F },
  { "GDEW026T0", GxEPD2::Panel::GDEW026T0 },
  { "GDEH029A1", GxEPD2::Panel::GDEH029A1 },
  { "GDEW029T5", GxEPD2::Panel::GDEW029T5 },
  { "GDEW027W3", GxEPD2::Panel::GDEW027W3 },
  { "GDEW0371W7", GxEPD2::Panel::GDEW0371W7 },
  { "GDEW042T2", GxEPD2::Panel::GDEW042T2 },
  { "GDEW0583T7", GxEPD2::Panel::GDEW0583T7 },
  { "GDEW075T8", GxEPD2::Panel::GDEW075T8 },
  { "GDEW075T7", GxEPD2::Panel::GDEW075T7 },
  { "ED060SCT", GxEPD2::Panel::ED060SCT },
  { "GDEW0154Z04", GxEPD2::Panel::GDEW0154Z04 },
  { "GDEW0213Z16", GxEPD2::Panel::GDEW0213Z16 },
  { "GDEW029Z10", GxEPD2::Panel::GDEW029Z10 },
  { "GDEW027C44", GxEPD2::Panel::GDEW027C44 },
  { "GDEW042Z15", GxEPD2::Panel::GDEW042Z15 },
  { "GDEW0583Z21", GxEPD2::Panel::GDEW0583Z21 },
  { "GDEW075Z09", GxEPD2::Panel::GDEW075Z09 },
  { "GDEW075Z08", GxEPD2::Panel::GDEW075Z08 }
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
      return true;
    default:
      return false;
  }
}

GxEPD2_GFX* DisplayTypeHelpers::buildDisplay(GxEPD2::Panel type, uint8_t dc, uint8_t rst, uint8_t busy) {
  switch (type) {
    // black/white displays
    case GxEPD2::Panel::GDEP015OC1:
      return __gxepd2_build_bw_driver<GxEPD2_154>(dc, rst, busy);
    case GxEPD2::Panel::GDE0213B1:
      return __gxepd2_build_bw_driver<GxEPD2_213>(dc, rst, busy);
    case GxEPD2::Panel::GDEH0213B72:
      return __gxepd2_build_bw_driver<GxEPD2_213_B72>(dc, rst, busy);
    case GxEPD2::Panel::GDEW0213I5F:
      return __gxepd2_build_bw_driver<GxEPD2_213_flex>(dc, rst, busy);
    case GxEPD2::Panel::GDEH029A1:
      return __gxepd2_build_bw_driver<GxEPD2_290>(dc, rst, busy);
    case GxEPD2::Panel::GDEW029T5:
      return __gxepd2_build_bw_driver<GxEPD2_290_T5>(dc, rst, busy);
    case GxEPD2::Panel::GDEW027W3:
      return __gxepd2_build_bw_driver<GxEPD2_270>(dc, rst, busy);
    case GxEPD2::Panel::GDEW042T2:
      return __gxepd2_build_bw_driver<GxEPD2_420>(dc, rst, busy);
    case GxEPD2::Panel::GDEW0583T7:
      return __gxepd2_build_bw_driver<GxEPD2_583>(dc, rst, busy);
    case GxEPD2::Panel::GDEW075T8:
      return __gxepd2_build_bw_driver<GxEPD2_750>(dc, rst, busy);

    // Color displays
    case GxEPD2::Panel::ED060SCT:
      return __gxepd2_build_3c_driver<GxEPD2_it60>(dc, rst, busy);
    case GxEPD2::Panel::GDEW0154Z04:
      return __gxepd2_build_3c_driver<GxEPD2_154c>(dc, rst, busy);
    case GxEPD2::Panel::GDEW0213Z16:
      return __gxepd2_build_3c_driver<GxEPD2_213c>(dc, rst, busy);
    case GxEPD2::Panel::GDEW029Z10:
      return __gxepd2_build_3c_driver<GxEPD2_290c>(dc, rst, busy);
    case GxEPD2::Panel::GDEW027C44:
      return __gxepd2_build_3c_driver<GxEPD2_270c>(dc, rst, busy);
    case GxEPD2::Panel::GDEW042Z15:
      return __gxepd2_build_3c_driver<GxEPD2_420c>(dc, rst, busy);
    case GxEPD2::Panel::GDEW0583Z21:
      return __gxepd2_build_3c_driver<GxEPD2_583c>(dc, rst, busy);
    case GxEPD2::Panel::GDEW075Z09:
      return __gxepd2_build_3c_driver<GxEPD2_750c>(dc, rst, busy);
    default:
      Serial.printf_P(PSTR("Unsupported display type, using default.  Provided display: %d\n"), static_cast<size_t>(type));
      return buildDisplay(DisplayTypeHelpers::DEFAULT_PANEL, dc, rst, busy);
  }
}