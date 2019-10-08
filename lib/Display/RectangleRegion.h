#include <Region.h>

#include <GxEPD2_EPD.h>
#include <GxEPD2_GFX.h>
#include <Adafruit_GFX.h>
#include <ArduinoJson.h>

#include <memory>

#pragma once

class RectangleRegion : public Region {
public:
  enum class RectangleStyle {
    FILLED, OUTLINE
  };

  enum class DimensionType {
    STATIC, DYNAMIC
  };

  struct Dimension {
    DimensionType type;
    uint16_t value;

    static bool hasVariable(JsonObject spec);
    static String extractVariable(JsonObject spec);
    static Dimension fromSpec(JsonObject spec);
  };

  RectangleRegion(
    const String& variable,
    uint16_t x,
    uint16_t y,
    Dimension width,
    Dimension height,
    uint16_t color,
    std::shared_ptr<const VariableFormatter> formatter,
    RectangleStyle style
  );
  ~RectangleRegion();

  virtual void render(GxEPD2_GFX* display);

  static RectangleStyle styleFromString(const String& str);
private:
  const RectangleStyle style;
  const Dimension w, h;
};