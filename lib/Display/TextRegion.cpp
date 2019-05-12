#include <TextRegion.h>

#define BB_COORD(c, d) (static_cast<uint16_t>(((c) >= 0) ? (c) : (d)))

TextRegion::TextRegion(
  const String& variable,
  uint16_t x,
  uint16_t y,
  int16_t fixedBbX,
  int16_t fixedBbY,
  int16_t fixedBbW,
  int16_t fixedBbH,
  uint16_t color,
  const GFXfont* font,
  std::shared_ptr<const VariableFormatter> formatter
) : Region(variable, x, y, 0, 0, color, formatter), font(font),
    bbX(x), bbY(y),
    fixedBbX(fixedBbX), fixedBbY(fixedBbY), fixedBbW(fixedBbW), fixedBbH(fixedBbH),
    prevX(x), prevY(y), prevW(w), prevH(h)
{ }

TextRegion::~TextRegion() { }

void TextRegion::render(GxEPD2_GFX* display) {
  // Clear the previous text
  // TODO: expose setting for background color
  display->fillRect(this->bbX, this->bbY, this->w, this->h, GxEPD_WHITE);

  display->setTextColor(color);
  display->setFont(font);
  display->setCursor(x, y);
  display->print(variableValue);

  // Find and persist bounding box.  Need to persist in case it shrinks next
  // time.  Update should always be for the larger bounding box.
  int16_t x1, y1;
  uint16_t w, h;
  char valueCpy[variableValue.length() + 1];
  strcpy(valueCpy, variableValue.c_str());

  display->getTextBounds(valueCpy, x, y, &x1, &y1, &w, &h);

  this->prevX = this->bbX;
  this->prevY = this->bbY;
  this->prevW = this->w;
  this->prevH = this->h;

  this->bbX = x1;
  this->bbY = y1;
  this->w = w;
  this->h = h;
}

Rectangle TextRegion::getBoundingBox() {
  return {
    .x = BB_COORD(fixedBbX, _min(this->bbX, this->prevX)),
    .y = BB_COORD(fixedBbY, _min(this->bbY, this->prevY)),
    .w = BB_COORD(fixedBbW, _max(this->w, this->prevW)),
    .h = BB_COORD(fixedBbH, _max(this->h, this->prevH))
  };
}
