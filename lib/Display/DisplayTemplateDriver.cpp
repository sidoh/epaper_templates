#include <FS.h>
#include <DisplayTemplateDriver.h>

DisplayTemplateDriver::DisplayTemplateDriver(
  GxEPD* display,
  Settings& settings
)
  : display(display),
    dirty(true),
    shouldFullUpdate(false),
    lastFullUpdate(0),
    settings(settings)
{ }

void DisplayTemplateDriver::init() {
  display->init();
  vars.load();
}

void DisplayTemplateDriver::loop() {
  if (newTemplate.length() > 0) {
    // Delete regions so we don't have unused regions hanging around
    regions.clear();

    // Always schedule a full update.  Even if template is the same, it could've
    // changed.
    scheduleFullUpdate();

    loadTemplate(newTemplate);

    // Clear template to indicate that it's been loaded
    this->templateFilename = newTemplate;
    this->newTemplate = "";
  }

  if (shouldFullUpdate || dirty) {
    time_t now = millis();

    if (shouldFullUpdate || now > (lastFullUpdate + settings.fullRefreshPeriod)) {
      shouldFullUpdate = false;
      lastFullUpdate = now;
      fullUpdate();

      // No need to do partial updates
      clearDirtyRegions();
    } else {
      flushDirtyRegions(true);
    }

    dirty = false;
  }
}

void DisplayTemplateDriver::scheduleFullUpdate() {
  shouldFullUpdate = true;
}

void DisplayTemplateDriver::clearDirtyRegions() {
  DoublyLinkedListNode<std::shared_ptr<Region>>* curr = regions.getHead();

  while (curr != NULL) {
    std::shared_ptr<Region> region = curr->data;
    region->clearDirty();

    curr = curr->next;
  }
}

void DisplayTemplateDriver::flushDirtyRegions(bool updateScreen) {
  DoublyLinkedListNode<std::shared_ptr<Region>>* curr = regions.getHead();

  while (curr != NULL) {
    std::shared_ptr<Region> region = curr->data;

    if (region->isDirty()) {
      region->clearDirty();
      region->render(display);

      if (updateScreen) {
        region->updateScreen(display);
      }
    }

    curr = curr->next;
  }
}

void DisplayTemplateDriver::fullUpdate() {
  flushDirtyRegions(false);
  display->update();
}

void DisplayTemplateDriver::updateVariable(const String& key, const String& value) {
  vars.set(key, value);

  DoublyLinkedListNode<std::shared_ptr<Region>>* curr = regions.getHead();

  while (curr != NULL) {
    std::shared_ptr<Region> region = curr->data;

    if (region->getVariableName() == key) {
      this->dirty = region->updateValue(value) || this->dirty;
    }

    curr = curr->next;
  }
}

void DisplayTemplateDriver::setTemplate(const String& templateFilename) {
  this->newTemplate = templateFilename;
}

const String& DisplayTemplateDriver::getTemplateFilename() {
  return templateFilename;
}

void DisplayTemplateDriver::loadTemplate(const String& templateFilename) {
  if (! SPIFFS.exists(templateFilename)) {
    Serial.println(F("WARN - template file does not exist"));
    printError("Template file does not exist");

    return;
  }

  Serial.print(F("Loading template: "));
  Serial.println(templateFilename);

  File file = SPIFFS.open(templateFilename, "r");

  DynamicJsonBuffer jsonBuffer;
  JsonObject& tmpl = jsonBuffer.parseObject(file);
  file.close();

  Serial.print(F("Free heap - "));
  Serial.println(ESP.getFreeHeap());

  if (!tmpl.success()) {
    Serial.println(F("WARN - could not parse template file"));
    printError("Could not parse template!");

    return;
  }

  display->fillScreen(parseColor(tmpl["background_color"]));

  if (tmpl.containsKey("lines")) {
    renderLines(tmpl["lines"]);
  }

  if (tmpl.containsKey("bitmaps")) {
    renderBitmaps(tmpl["bitmaps"]);
  }

  if (tmpl.containsKey("text")) {
    renderTexts(tmpl["text"]);
  }
}

void DisplayTemplateDriver::renderBitmap(const String &filename, uint16_t x, uint16_t y, uint16_t w, uint16_t h, uint16_t color) {
  if (! SPIFFS.exists(filename)) {
    Serial.print(F("WARN - tried to render bitmap file that doesn't exist: "));
    Serial.println(filename);
    return;
  }

  File file = SPIFFS.open(filename, "r");
  size_t size = w*h/8;
  uint8_t bits[size];
  size_t readBytes = file.readBytes(reinterpret_cast<char*>(bits), size);

  file.close();
  display->drawBitmap(bits, x, y, w, h, color);
}

void DisplayTemplateDriver::renderBitmaps(ArduinoJson::JsonArray &bitmaps) {
  for (size_t i = 0; i < bitmaps.size(); i++) {
    JsonObject& bitmap = bitmaps[i];

    const uint16_t x = bitmap["x"];
    const uint16_t y = bitmap["y"];
    const uint16_t w = bitmap["w"];
    const uint16_t h = bitmap["h"];
    const uint16_t color = extractColor(bitmap);

    if (bitmap.containsKey("static")) {
      renderBitmap(bitmap.get<const char*>("static"), x, y, w, h, color);
    }

    if (bitmap.containsKey("variable")) {
      const String& variable = bitmap["variable"];
      std::shared_ptr<Region> region = addBitmapRegion(bitmap);
      region->updateValue(vars.get(variable));
    }
  }
}

void DisplayTemplateDriver::renderTexts(ArduinoJson::JsonArray &texts) {
  for (size_t i = 0; i < texts.size(); i++) {
    JsonObject& text = texts[i];

    uint16_t x = text["x"];
    uint16_t y = text["y"];

    // Font should be set first because it fiddles with the cursor.
    if (text.containsKey("font")) {
      display->setFont(parseFont(text["font"]));
    }

    display->setCursor(x, y);
    display->setTextColor(extractColor(text));

    if (text.containsKey("static")) {
      display->print(text.get<const char*>("static"));
    }

    if (text.containsKey("variable")) {
      const String& variable = text.get<const char*>("variable");
      std::shared_ptr<Region> region = addTextRegion(text);
      region->updateValue(vars.get(variable));
    }
  }
}

void DisplayTemplateDriver::renderLines(ArduinoJson::JsonArray &lines) {
  for (JsonArray::iterator it = lines.begin(); it != lines.end(); ++it) {
    JsonObject& line = *it;
    display->drawLine(line["x1"], line["y1"], line["x2"], line["y2"], extractColor(line));
  }
}

std::shared_ptr<Region> DisplayTemplateDriver::addBitmapRegion(const JsonObject& spec) {
  std::shared_ptr<Region> region(
    new BitmapRegion(
      spec.get<const char*>("variable"),
      spec["x"],
      spec["y"],
      spec["w"],
      spec["h"],
      extractColor(spec),
      VariableFormatter::buildFormatter(spec)
    )
  );
  regions.add(region);

  return region;
}

std::shared_ptr<Region> DisplayTemplateDriver::addTextRegion(const JsonObject& spec) {
  std::shared_ptr<Region> region(
    new TextRegion(
      spec.get<const char*>("variable"),
      spec.get<uint16_t>("x"),
      spec.get<uint16_t>("y"),
      0, // width and height are unknown until rendered
      0, // ^
      extractColor(spec),
      parseFont(spec.get<const char*>("font")),
      VariableFormatter::buildFormatter(spec)
    )
  );
  regions.add(region);

  return region;
}

void DisplayTemplateDriver::printError(const char *message) {
  display->fillScreen(GxEPD_BLACK);
  display->setFont(&FreeMonoBold9pt7b);
  display->setTextColor(GxEPD_WHITE);
  display->setCursor(0, display->height() / 2);
  display->print(message);
}

const GFXfont* DisplayTemplateDriver::parseFont(const String &fontName) {
  if (fontName.equalsIgnoreCase("FreeMonoBold24pt7b")) {
    return &FreeMonoBold24pt7b;
  } else if (fontName.equalsIgnoreCase("FreeSans18pt7b")) {
    return &FreeSans18pt7b;
  } else if (fontName.equalsIgnoreCase("FreeSans9pt7b")) {
    return &FreeSans9pt7b;
  } else if (fontName.equalsIgnoreCase("FreeSansBold9pt7b")) {
    return &FreeSansBold9pt7b;
  } else if (fontName.equalsIgnoreCase("FreeMono9pt7b")) {
    return &FreeMono9pt7b;
  } else {
    Serial.print(F("WARN - tried to fetch unknown font: "));
    Serial.println(fontName);

    return defaultFont;
  }
}

const uint16_t DisplayTemplateDriver::parseColor(const String &colorName) {
  if (colorName.equalsIgnoreCase("black")) {
    return GxEPD_BLACK;
  } else if (colorName.equalsIgnoreCase("red")) {
    return GxEPD_RED;
  } else {
    return GxEPD_WHITE;
  }
}

const uint16_t DisplayTemplateDriver::extractColor(const ArduinoJson::JsonObject &spec) {
  if (spec.containsKey("color")) {
    return parseColor(spec["color"]);
  } else {
    return defaultColor;
  }
}
