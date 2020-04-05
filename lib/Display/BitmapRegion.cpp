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
    uint16_t new_width, new_height;
    if(getBitmapDimensions(variableValue, &new_width, &new_height)){
      this->boundingBox.w = new_width;
      this->boundingBox.h = new_height;
    }

    // In case it's a new bitmap with a different size.
    Rectangle clearingBounds = getBoundingBox();
    Serial.println("sup");
    Serial.println(clearingBounds.w);
    Serial.println(clearingBounds.h);
    
    display->fillRect(
      clearingBounds.x,
      clearingBounds.y,
      clearingBounds.w,
      clearingBounds.h,
      this->background_color
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
  String metadata_filename = bitmapName.c_str();
  Serial.println("AAAAAAAAAAAA");
  
  metadata_filename.replace("/b/", "/m/");
  Serial.println(F("getting dimensions of bitmap:"));
    Serial.println(bitmapName);
    Serial.println(metadata_filename);
  if (!SPIFFS.exists(bitmapName) || !SPIFFS.exists(metadata_filename)) {
    Serial.println(F("WARN - tried to get dimensions from bitmap that doesn't exist: "));
    Serial.println(bitmapName);
    Serial.println(metadata_filename);
    return false;
  }

  File metadata_file = SPIFFS.open(metadata_filename, "r");

  DynamicJsonDocument jsonBuffer(2048);
  deserializeJson(jsonBuffer, metadata_file);
  metadata_file.close();
  JsonObject metadata = jsonBuffer.as<JsonObject>();
  if (metadata.isNull()) {
    Serial.println(F("WARN - could not parse metadata file"));
    return false;
  }

  //uint16_t w = *width;
  //uint16_t h = *height;

  *width = metadata["width"];
  *height = metadata["height"];
  //Serial.println(w);
  //Serial.println(h);
  return true;
}