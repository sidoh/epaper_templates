#include <RectangleRegion.h>

RectangleRegion::RectangleRegion(
  const String& variable,
  uint16_t x,
  uint16_t y,
  RectangleRegion::Dimension w,
  RectangleRegion::Dimension h,
  uint16_t color,
  std::shared_ptr<const VariableFormatter> formatter,
  RectangleStyle style
) : Region(
      variable,
      {x, y, w.value, h.value},
      color,
      formatter
    )
  , style(style)
  , w(w)
  , h(h)
{ }

RectangleRegion::~RectangleRegion() { }

void RectangleRegion::render(GxEPD2_GFX* display) {
  uint16_t width = w.getValue(variableValue);
  uint16_t height = h.getValue(variableValue);

  display->writeFillRect(boundingBox.x, boundingBox.y, boundingBox.w, boundingBox.h, GxEPD_WHITE);

  if (style == RectangleStyle::FILLED) {
    display->writeFillRect(boundingBox.x, boundingBox.y, width, height, color);
  } else {
    display->drawRect(boundingBox.x, boundingBox.y, width, height, color);
  }
}

RectangleRegion::RectangleStyle RectangleRegion::styleFromString(const String& str) {
  if (str == "filled") {
    return RectangleRegion::RectangleStyle::FILLED;
  } else {
    return RectangleRegion::RectangleStyle::OUTLINE;
  }
}

uint16_t RectangleRegion::Dimension::getValue(const String& variableValue) const {
  if (this->type == RectangleRegion::DimensionType::STATIC) {
    return this->value;
  } else {
    const uint16_t value = variableValue.toInt();

    if (this->type == RectangleRegion::DimensionType::DYNAMIC) {
      return min(this->value, value);
    } else {
      const uint16_t valueFromPct = round(value * (this->value / 100.0));
      return min(this->value, valueFromPct);
    }
  }
}

bool RectangleRegion::Dimension::hasVariable(JsonObject spec) {
  return spec["width"].containsKey("variable")
    || spec["height"].containsKey("variable");
}

String RectangleRegion::Dimension::extractVariable(JsonObject spec) {
  JsonVariant vw = spec["width"]["variable"];
  if (! vw.isNull()) {
    return vw.as<const char*>();
  }

  JsonVariant vh = spec["height"]["variable"];
  if (! vh.isNull()) {
    return vh.as<const char*>();
  }

  return "";
}

RectangleRegion::Dimension RectangleRegion::Dimension::fromSpec(JsonObject spec) {
  if (spec.containsKey(F("static"))) {
    return { DimensionType::STATIC, spec[F("static")] };
  } else if (spec.containsKey(F("variable_mode")) && spec[F("variable_mode")] == F("percent")) {
    return { DimensionType::DYNAMIC_PCT, spec[F("max")] };
  } else {
    return { DimensionType::DYNAMIC, spec[F("max")] };
  }
}