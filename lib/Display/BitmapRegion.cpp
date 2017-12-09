#include <FS.h>
#include <BitmapRegion.h>

BitmapRegion::BitmapRegion(
  const String& variable,
  uint16_t x,
  uint16_t y,
  uint16_t w,
  uint16_t h,
  uint16_t color,
  std::shared_ptr<const VariableFormatter> formatter
) : Region(variable, x, y, w, h, color, formatter)
{ }

BitmapRegion::~BitmapRegion() { }

void BitmapRegion::render(GxEPD* display) {
  if (! SPIFFS.exists(variableValue)) {
    Serial.print(F("WARN - tried to render bitmap file that doesn't exist: "));
    Serial.println(variableValue);
  } else {
    File file = SPIFFS.open(variableValue, "r");
    size_t size = w*h/8;
    uint8_t bits[size];
    size_t readBytes = file.readBytes(reinterpret_cast<char*>(bits), size);

    file.close();
    display->drawBitmap(bits, x, y, w, h, color);
  }

  this->dirty = false;
}
