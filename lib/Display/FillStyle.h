#include <Arduino.h>

#pragma once

enum class FillStyle {
  OUTLINE, FILLED
};

FillStyle fillStyleFromString(const String& str);