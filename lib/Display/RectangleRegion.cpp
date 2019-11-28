#include <FillStyle.h>
#include <RectangleRegion.h>

RectangleRegion::RectangleRegion(const String& variable,
    uint16_t x,
    uint16_t y,
    RectangleRegion::Dimension w,
    RectangleRegion::Dimension h,
    uint16_t color,
    std::shared_ptr<const VariableFormatter> formatter,
    FillStyle fillStyle
) : Region(variable, {x, y, 0, 0}, color, formatter)
  , fillStyle(fillStyle)
  , w(w)
  , h(h)
{}

RectangleRegion::~RectangleRegion() {}

void RectangleRegion::render(GxEPD2_GFX* display) {
  uint16_t width = w.getValue(variableValue);
  uint16_t height = h.getValue(variableValue);

  Serial.printf_P(PSTR("Drawing rectangle: (x=%d, y=%d, w=%d, h=%d)\n"), boundingBox.x, boundingBox.y, w, h);

  display->writeFillRect(boundingBox.x,
      boundingBox.y,
      boundingBox.w,
      boundingBox.h,
      GxEPD_WHITE);

  if (fillStyle == FillStyle::FILLED) {
    display->writeFillRect(boundingBox.x, boundingBox.y, width, height, color);
  } else {
    display->drawRect(boundingBox.x, boundingBox.y, width, height, color);
  }
}

uint16_t RectangleRegion::Dimension::getValue(
    const String& variableValue) const {
  if (this->type == RectangleRegion::DimensionType::STATIC) {
    return this->value;
  } else {
    return variableValue.toInt();
  }
}

bool RectangleRegion::Dimension::hasVariable(JsonObject spec) {
  return spec["w"]["type"].as<String>().equalsIgnoreCase("variable") ||
      spec["h"]["type"].as<String>().equalsIgnoreCase("variable");
}

String RectangleRegion::Dimension::extractVariable(JsonObject spec) {
  JsonVariant vw = spec["w"]["variable"];
  if (!vw.isNull()) {
    return vw.as<const char*>();
  }

  JsonVariant vh = spec["h"]["variable"];
  if (!vh.isNull()) {
    return vh.as<const char*>();
  }

  return "";
}

RectangleRegion::Dimension RectangleRegion::Dimension::fromSpec(
    JsonObject spec) {
  if (spec["type"].as<String>().equalsIgnoreCase("variable")) {
    return {DimensionType::VARIABLE, 0};
  } else {
    return {DimensionType::STATIC, spec["value"]};
  }
}