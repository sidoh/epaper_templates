#include <GxEPD2.h>
#include <GxEPD2_GFX.h>
#include <GxEPD2_BW.h>
#include <GxEPD2_3C.h>
#include <DisplayTypeHelpers.h>

#define __gxepd2_build_driver(DriverType, DisplayType) (\
  new DriverType<DisplayType, DisplayType::HEIGHT>(DisplayType(SS, dc, rst, busy)) \
)

#define __gxepd2_build_bw_driver(DisplayType) ( __gxepd2_build_driver(GxEPD2_BW, DisplayType) )
#define __gxepd2_build_3c_driver(DisplayType) ( __gxepd2_build_driver(GxEPD2_3C, DisplayType) )

const char* DisplayTypeHelpers::DISPLAY_NAMES[] = {
  "GDEP015OC1",
  "GDE0213B1",
  "GDEH0213B72",
  "GDEW0213I5F",
  "GDEH029A1",
  "GDEW029T5",
  "GDEW027W3",
  "GDEW042T2",
  "GDEW0583T7",
  "GDEW075T8",
  "ED060SCT",
  "GDEW0154Z04",
  "GDEW0213Z16",
  "GDEW029Z10",
  "GDEW027C44",
  "GDEW042Z15",
  "GDEW0583Z21",
  "GDEW075Z09"
};

template<typename T, size_t sz>
size_t __size(T(&)[sz]) {
    return sz;
}

const GxEPD2::Panel DisplayTypeHelpers::DEFAULT_PANEL = GxEPD2::Panel::GDEW042T2;

String DisplayTypeHelpers::displayTypeToString(GxEPD2::Panel type) {
  size_t ix = static_cast<size_t>(type);

  if (ix > __size(DISPLAY_NAMES)) {
    return "UNKNOWN";
  }

  return DISPLAY_NAMES[ix];
}

GxEPD2::Panel DisplayTypeHelpers::stringToDisplayType(const String& displayType) {
  for (size_t i = 0; i < __size(DISPLAY_NAMES); ++i) {
    if (displayType.equalsIgnoreCase(DISPLAY_NAMES[i])) {
      return static_cast<GxEPD2::Panel>(i);
    }
  }
  return DEFAULT_PANEL;
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
      return __gxepd2_build_bw_driver(GxEPD2_154);
    case GxEPD2::Panel::GDE0213B1:
      return __gxepd2_build_bw_driver(GxEPD2_213);
    case GxEPD2::Panel::GDEH0213B72:
      return __gxepd2_build_bw_driver(GxEPD2_213_B72);
    case GxEPD2::Panel::GDEW0213I5F:
      return __gxepd2_build_bw_driver(GxEPD2_213_flex);
    case GxEPD2::Panel::GDEH029A1:
      return __gxepd2_build_bw_driver(GxEPD2_290);
    case GxEPD2::Panel::GDEW029T5:
      return __gxepd2_build_bw_driver(GxEPD2_290_T5);
    case GxEPD2::Panel::GDEW027W3:
      return __gxepd2_build_bw_driver(GxEPD2_270);
    case GxEPD2::Panel::GDEW042T2:
      return __gxepd2_build_bw_driver(GxEPD2_420);
    case GxEPD2::Panel::GDEW0583T7:
      return __gxepd2_build_bw_driver(GxEPD2_583);
    case GxEPD2::Panel::GDEW075T8:
      return __gxepd2_build_bw_driver(GxEPD2_750);

    // Color displays
    case GxEPD2::Panel::ED060SCT:
      return __gxepd2_build_3c_driver(GxEPD2_it60);
    case GxEPD2::Panel::GDEW0154Z04:
      return __gxepd2_build_3c_driver(GxEPD2_154c);
    case GxEPD2::Panel::GDEW0213Z16:
      return __gxepd2_build_3c_driver(GxEPD2_213c);
    case GxEPD2::Panel::GDEW029Z10:
      return __gxepd2_build_3c_driver(GxEPD2_290c);
    case GxEPD2::Panel::GDEW027C44:
      return __gxepd2_build_3c_driver(GxEPD2_270c);
    case GxEPD2::Panel::GDEW042Z15:
      return __gxepd2_build_3c_driver(GxEPD2_420c);
    case GxEPD2::Panel::GDEW0583Z21:
      return __gxepd2_build_3c_driver(GxEPD2_583c);
    case GxEPD2::Panel::GDEW075Z09:
      return __gxepd2_build_3c_driver(GxEPD2_750c);
    default:
      Serial.printf_P(PSTR("Unsupported display type, using default.  Provided display: %d\n"), static_cast<size_t>(type));
      return buildDisplay(DisplayTypeHelpers::DEFAULT_PANEL, dc, rst, busy);
  }
}