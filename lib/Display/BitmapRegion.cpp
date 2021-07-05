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
    , backgroundColor(backgroundColor)
    {}

BitmapRegion::~BitmapRegion() {}

void BitmapRegion::render(GxEPD2_GFX* display) {
  if (!SPIFFS.exists(variableValue)) {
    Serial.print(F("WARN - tried to render bitmap file that doesn't exist: "));
    Serial.println(variableValue);
  } else {
    this->previousBound = this->boundingBox;
    uint16_t newWidth, newHeight;
    if(getBitmapDimensions(variableValue, &newWidth, &newHeight)){
      this->boundingBox.w = newWidth;
      this->boundingBox.h = newHeight;
    }

    // In case it's a new bitmap with a different size.
    Rectangle clearingBounds = getBoundingBox();
    
    display->fillRect(
      clearingBounds.x,
      clearingBounds.y,
      clearingBounds.w,
      clearingBounds.h,
      this->backgroundColor
    );

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

Rectangle BitmapRegion::getBoundingBox() {
  return {
    .x = std::min(this->boundingBox.x, this->previousBound.x),
    .y = std::min(this->boundingBox.y, this->previousBound.y),
    .w = std::max(this->boundingBox.w, this->previousBound.w),
    .h = std::max(this->boundingBox.h, this->previousBound.h)
  };
}

bool BitmapRegion::getBitmapDimensions(const String& bitmapName, uint16_t *width, uint16_t *height){
  String metadataFilename = bitmapName.c_str();
  
  metadataFilename.replace("/b/", "/m/");
  if (!SPIFFS.exists(bitmapName) || !SPIFFS.exists(metadataFilename)) {
    Serial.println(F("WARN - tried to get dimensions from bitmap that doesn't exist: "));
    Serial.println(bitmapName);
    return false;
  }

  File metadata_file = SPIFFS.open(metadataFilename, "r");

  StaticJsonDocument<100> jsonBuffer;
  deserializeJson(jsonBuffer, metadata_file);
  metadata_file.close();
  JsonObject metadata = jsonBuffer.as<JsonObject>();
  if (metadata.isNull()) {
    Serial.println(F("WARN - could not parse metadata file"));
    return false;
  }


  *width = metadata["width"];
  *height = metadata["height"];
  return true;
}
