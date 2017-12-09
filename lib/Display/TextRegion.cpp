#include <TextRegion.h>

TextRegion::TextRegion(
  const String& variable,
  uint16_t x,
  uint16_t y,
  uint16_t w,
  uint16_t h,
  uint16_t color,
  const GFXfont* font,
  std::shared_ptr<const VariableFormatter> formatter
) : Region(variable, x, y, w, h, color, formatter), font(font),
    bbX(x), bbY(y),
    prevX(x), prevY(y), prevW(w), prevH(h)
{ }

TextRegion::~TextRegion() { }

void TextRegion::render(GxEPD* display) {
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
  memset(valueCpy, 0, variableValue.length() + 1);
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

  this->dirty = false;
}

void TextRegion::getBoundingBox(uint16_t& x, uint16_t& y, uint16_t& w, uint16_t& h) {
  x = _min(this->bbX, this->prevX);
  y = _min(this->bbY, this->prevY);
  w = _max(this->w, this->prevW);
  h = _max(this->h, this->prevH);
}
