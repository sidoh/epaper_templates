#include <Region.h>

Region::Region(
  const String& variable,
  uint16_t x,
  uint16_t y,
  uint16_t w,
  uint16_t h,
  uint16_t color,
  std::shared_ptr<const VariableFormatter> formatter
) : variable(variable), x(x), y(y), w(w), h(h), color(color), formatter(formatter)
{ }

Region::~Region() { }

const String& Region::getVariableName() const {
  return this->variable;
}

void Region::clearDirty() {
  this->dirty = false;
}

bool Region::isDirty() const {
  return this->dirty;
}

bool Region::updateValue(const String &value) {
  String newValue = formatter->format(value);

  // No change
  if (newValue == variableValue) {
    return false;
  }

  this->variableValue = newValue;
  this->dirty = true;

  return true;
}

Rectangle Region::updateScreen(GxEPD2_GFX* display) {
  Rectangle r = getBoundingBox();
  display->refresh(r.x, r.y, r.w, r.h);
  return r;
}

Rectangle Region::getBoundingBox() {
  return {
    .x = this->x,
    .y = this->y,
    .w = this->w,
    .h = this->h
  };
}
