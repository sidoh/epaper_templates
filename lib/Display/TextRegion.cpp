#include <TextRegion.h>

#define BB_COORD(c, d) (static_cast<uint16_t>(((c) >= 0) ? (c) : (d)))

TextRegion::TextRegion(
  const String& variable,
  uint16_t x,
  uint16_t y,
  std::shared_ptr<Rectangle> fixedBound,
  uint16_t color,
  const GFXfont* font,
  std::shared_ptr<const VariableFormatter> formatter,
  uint8_t size,
  uint16_t index
) : Region(
      variable,
      {x, y, 0, 0},
      color,
      formatter,
      "t-" + String(index)
    )
  , font(font)
  , fixedBound(fixedBound)
  , currentBound({x, y, 0, 0})
  , previousBound({x, y, 0, 0})
  , size(size)
{ }

TextRegion::~TextRegion() { }

void TextRegion::render(GxEPD2_GFX* display) {
  // Clear the previous text
  // TODO: expose setting for background color
  display->fillRect(
    this->currentBound.x,
    this->currentBound.y,
    this->currentBound.w,
    this->currentBound.h,
    GxEPD_WHITE
  );

  display->setTextColor(color);
  display->setFont(font);
  display->setTextSize(size);
  display->setCursor(this->boundingBox.x, this->boundingBox.y);
  display->print(variableValue);

  // Find and persist bounding box.  Need to persist in case it shrinks next
  // time.  Update should always be for the larger bounding box.
  int16_t x1, y1;
  uint16_t w, h;
  char valueCpy[variableValue.length() + 1];
  strcpy(valueCpy, variableValue.c_str());

  display->getTextBounds(valueCpy, this->boundingBox.x, this->boundingBox.y, &x1, &y1, &w, &h);

  this->previousBound = this->currentBound;
  this->currentBound = {x1, y1, w, h};
}

Rectangle TextRegion::getBoundingBox() {
  if (fixedBound != nullptr) {
    return *fixedBound;
  } else {
    return {
      .x = std::min(this->currentBound.x, this->previousBound.x),
      .y = std::min(this->currentBound.y, this->previousBound.y),
      .w = std::max(this->currentBound.w, this->previousBound.w),
      .h = std::max(this->currentBound.h, this->previousBound.h)
    };
  }
}
