#include <BitmapRegion.h>
#include <DisplayTemplateDriver.h>
#include <FS.h>

BitmapRegion::BitmapRegion(const String& variable,
    uint16_t x,
    uint16_t y,
    uint16_t w,
    uint16_t h,
    uint16_t color,
    uint16_t backgroundColor,
    std::shared_ptr<const VariableFormatter> formatter,
    uint16_t index)
    : Region(variable, {x, y, w, h}, color, formatter, "b-" + String(index))
    , backgroundColor(backgroundColor) {}

BitmapRegion::~BitmapRegion() {}

void BitmapRegion::render(GxEPD2_GFX* display) {
  if (!SPIFFS.exists(variableValue)) {
    Serial.print(F("WARN - tried to render bitmap file that doesn't exist: "));
    Serial.println(variableValue);
  } else {
    File file = SPIFFS.open(variableValue, "r");
    size_t size = (boundingBox.w * boundingBox.h) / 8;
    uint8_t bits[size];
    file.readBytes(reinterpret_cast<char*>(bits), size);

    file.close();

    DisplayTemplateDriver::drawBitmap(display,
        bits,
        boundingBox.x,
        boundingBox.y,
        boundingBox.w,
        boundingBox.h,
        color,
        backgroundColor);
  }
}
