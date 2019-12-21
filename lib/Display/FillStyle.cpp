#include <FillStyle.h>

FillStyle fillStyleFromString(const String& str) {
  if (str.equalsIgnoreCase("filled")) {
    return FillStyle::FILLED;
  } else {
    return FillStyle::OUTLINE;
  }
}