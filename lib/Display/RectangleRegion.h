#include <Adafruit_GFX.h>
#include <ArduinoJson.h>
#include <GxEPD2_EPD.h>
#include <GxEPD2_GFX.h>
#include <Region.h>
#include <FillStyle.h>

#include <memory>

#pragma once

class RectangleRegion : public Region {
 public:
  enum class DimensionType { STATIC, VARIABLE };

  struct Dimension {
    DimensionType type;
    uint16_t value;

    uint16_t getValue(const String& variableValue) const;

    static bool hasVariable(JsonObject spec);
    static String extractVariable(JsonObject spec);
    static JsonObject extractFormatterDefinition(JsonObject spec);
    static Dimension fromSpec(JsonObject spec);
  };

  RectangleRegion(const String& variable,
      uint16_t x,
      uint16_t y,
      Dimension width,
      Dimension height,
      uint16_t color,
      std::shared_ptr<const VariableFormatter> formatter,
      FillStyle fillStyle);
  ~RectangleRegion();

  virtual void render(GxEPD2_GFX* display);

 private:
  const FillStyle fillStyle;
  const Dimension w, h;
  Rectangle previousBoundingBox;
};