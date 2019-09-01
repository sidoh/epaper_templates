#include <Region.h>

Region::Region(
  const String& variable,
  Rectangle boundingBox,
  uint16_t color,
  std::shared_ptr<const VariableFormatter> formatter
) : variable(variable)
  , boundingBox(boundingBox)
  , color(color)
  , formatter(formatter)
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

  Serial.printf_P(PSTR("Formatted value: %s\n"), newValue.c_str());

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
  return boundingBox;
}
