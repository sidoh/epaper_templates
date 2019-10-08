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
  uint16_t width, height;

  if (w.type == DimensionType::STATIC) {
    width = w.value;
  } else {
    width = min(static_cast<uint16_t>(w.value), static_cast<uint16_t>(variableValue.toInt()));
  }

  if (h.type == DimensionType::STATIC) {
    height = h.value;
  } else {
    height = min(static_cast<uint16_t>(h.value), static_cast<uint16_t>(variableValue.toInt()));
  }

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