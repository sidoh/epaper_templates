#include <FS.h>
#include <DisplayTemplateDriver.h>

#define JSON_VAL_OR_DEFAULT(json, key, d) (json.containsKey(key) ? json[key] : d)

DisplayTemplateDriver::DisplayTemplateDriver(
  GxEPD* display,
  Settings& settings
)
  : display(display),
    dirty(true),
    shouldFullUpdate(false),
    lastFullUpdate(0),
    settings(settings)
{ 
#if defined(ESP32)
  mutex = xSemaphoreCreateMutex();

  if (mutex == NULL) {
    Serial.println(F("ERROR: could not create mutex"));
  }
#endif
}

void DisplayTemplateDriver::init() {
  display->init();
  vars.load();
}

void DisplayTemplateDriver::loop() {
#if defined(ESP32)
  xSemaphoreTake(mutex, portMAX_DELAY);
#endif

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
#if defined(ESP32)
  xSemaphoreGive(mutex);
#endif
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

  // Render everything first
  while (curr != NULL) {
    std::shared_ptr<Region> region = curr->data;

    if (region->isDirty()) {
      printf("Rendering %s\n", region->getVariableName().c_str());
      region->render(display);
    }

    curr = curr->next;
  }

  // Can skip partial updates if we don't need to update the screen
  if (updateScreen) {
    // Issue partial updates to bounding boxes
    // This is crappy and O(n^2), but shouldn't matter unless there are shitlaods of regions.
    DoublyLinkedList<Rectangle> flushedRegions;

    curr = regions.getHead();
    while (curr != NULL) {
      std::shared_ptr<Region> region = curr->data;

      if (region->isDirty()) {
        region->clearDirty();

        Rectangle bb = region->getBoundingBox();

        if (! DisplayTemplateDriver::regionContainedIn(bb, flushedRegions)) {
          display->updateWindow(bb.x, bb.y, bb.w, bb.h);
          flushedRegions.add(bb);
        }
      }

      curr = curr->next;
    }
  }
}

bool DisplayTemplateDriver::regionContainedIn(Rectangle& r, DoublyLinkedList<Rectangle>& others) {
  DoublyLinkedListNode<Rectangle>* curr = others.getHead();

  while (curr != NULL) {
    Rectangle other = curr->data;

    if (r.x >= other.x 
      && r.y >= other.y
      && (r.x + r.w) <= (other.x + other.w)
      && (r.y + r.h) <= (other.y + other.h)
    ) {
      return true;
    }

    curr = curr->next;
  }

  return false;
}

void DisplayTemplateDriver::fullUpdate() {
  flushDirtyRegions(false);
  display->update();
}

void DisplayTemplateDriver::updateVariable(const String& key, const String& value) {
#if defined(ESP32)
  xSemaphoreTake(mutex, portMAX_DELAY);
#endif

  vars.set(key, value);

  DoublyLinkedListNode<std::shared_ptr<Region>>* curr = regions.getHead();

  while (curr != NULL) {
    std::shared_ptr<Region> region = curr->data;

    if (region->getVariableName() == key) {
      this->dirty = region->updateValue(value) || this->dirty;
    }

    curr = curr->next;
  }

#if defined(ESP32)
  xSemaphoreGive(mutex);
#endif
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

  const JsonObject& formatters = tmpl["formatters"];
  VariableFormatterFactory formatterFactory(formatters);

  if (tmpl.containsKey("lines")) {
    renderLines(tmpl["lines"]);
  }

  if (tmpl.containsKey("bitmaps")) {
    renderBitmaps(formatterFactory, tmpl["bitmaps"]);
  }

  if (tmpl.containsKey("text")) {
    renderTexts(formatterFactory, tmpl["text"]);
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

void DisplayTemplateDriver::renderBitmaps(VariableFormatterFactory& formatterFactory, ArduinoJson::JsonArray &bitmaps) {
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
      std::shared_ptr<Region> region = addBitmapRegion(formatterFactory, bitmap);
      region->updateValue(vars.get(variable));
    }
  }
}

void DisplayTemplateDriver::renderTexts(VariableFormatterFactory& formatterFactory, ArduinoJson::JsonArray &texts) {
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
      std::shared_ptr<Region> region = addTextRegion(formatterFactory, text);
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

std::shared_ptr<Region> DisplayTemplateDriver::addBitmapRegion(VariableFormatterFactory& formatterFactory, const JsonObject& spec) {
  std::shared_ptr<Region> region(
    new BitmapRegion(
      spec.get<const char*>("variable"),
      spec["x"],
      spec["y"],
      spec["w"],
      spec["h"],
      extractColor(spec),
      formatterFactory.create(spec)
    )
  );
  regions.add(region);

  return region;
}

std::shared_ptr<Region> DisplayTemplateDriver::addTextRegion(VariableFormatterFactory& formatterFactory, const JsonObject& spec) {
  int16_t bbx = -1, bby = -1, bbw = -1, bbh = -1;

  if (spec.containsKey("update_rect")) {
    JsonObject& updateParams = spec["update_rect"];

    bbx = JSON_VAL_OR_DEFAULT(updateParams, "x", -1);
    bby = JSON_VAL_OR_DEFAULT(updateParams, "y", -1);
    bbw = JSON_VAL_OR_DEFAULT(updateParams, "w", -1);
    bbh = JSON_VAL_OR_DEFAULT(updateParams, "h", -1);
  }

  std::shared_ptr<Region> region(
    new TextRegion(
      spec.get<const char*>("variable"),
      spec.get<uint16_t>("x"),
      spec.get<uint16_t>("y"),
      bbx,
      bby,
      bbw,
      bbh,
      extractColor(spec),
      parseFont(spec.get<const char*>("font")),
      formatterFactory.create(spec)
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
