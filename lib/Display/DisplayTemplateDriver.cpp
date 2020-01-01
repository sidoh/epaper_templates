#include <DisplayTemplateDriver.h>
#include <FS.h>
#include <FillStyle.h>

#define JSON_VAL_OR_DEFAULT(json, key, d) \
  (json.containsKey(key) ? json[key] : d)

DisplayTemplateDriver::DisplayTemplateDriver(
    GxEPD2_GFX* display, Settings& settings)
    : display(display)
    , settings(settings)
    , onVariableUpdateFn(nullptr)
    , onRegionUpdateFn(nullptr)
    , dirty(true)
    , shouldFullUpdate(false)
    , lastFullUpdate(0) {
#if defined(ESP32)
  mutex = xSemaphoreCreateMutex();

  if (mutex == NULL) {
    Serial.println(F("ERROR: could not create mutex"));
  }
#endif
}

void DisplayTemplateDriver::init() {
  display->init(115200);
  display->mirror(false);
  vars.load();
}

void DisplayTemplateDriver::loop() {
  vars.loop();

#if defined(ESP32)
  xSemaphoreTake(mutex, portMAX_DELAY);
#endif

  if (newTemplate.length() > 0) {
    Serial.printf_P(PSTR("Loading new template: %s\n"), newTemplate.c_str());

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

    if (shouldFullUpdate ||
        now > (lastFullUpdate + settings.display.full_refresh_period)) {
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

void DisplayTemplateDriver::scheduleFullUpdate() { shouldFullUpdate = true; }

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
      Serial.printf_P(PSTR("Rendering %s\n"),
          region->getVariableName().c_str());
      region->render(display);
    }

    curr = curr->next;
  }

  // Can skip partial updates if we don't need to update the screen
  if (updateScreen) {
    // Issue partial updates to bounding boxes
    // This is crappy and O(n^2), but shouldn't matter unless there are
    // shitlaods of regions.
    DoublyLinkedList<Rectangle> flushedRegions;

    curr = regions.getHead();
    while (curr != NULL) {
      std::shared_ptr<Region> region = curr->data;

      if (region->isDirty()) {
        region->clearDirty();

        Rectangle bb = region->getBoundingBox().rounded();

        if (!DisplayTemplateDriver::regionContainedIn(bb, flushedRegions)) {
          if (settings.display.windowed_updates) {
            display->displayWindow(bb.x, bb.y, bb.w, bb.h);
          }
          flushedRegions.add(bb);
        }
      }

      curr = curr->next;
    }

    // If we didn't issue windowed updates, do an update of the whole screen in
    // partial mode.
    if (!settings.display.windowed_updates) {
      display->display(true);
    }

    display->powerOff();
  }
}

bool DisplayTemplateDriver::regionContainedIn(
    Rectangle& r, DoublyLinkedList<Rectangle>& others) {
  DoublyLinkedListNode<Rectangle>* curr = others.getHead();

  while (curr != NULL) {
    Rectangle other = curr->data;

    if (r.x >= other.x && r.y >= other.y &&
        (r.x + r.w) <= (other.x + other.w) &&
        (r.y + r.h) <= (other.y + other.h)) {
      return true;
    }

    curr = curr->next;
  }

  return false;
}

void DisplayTemplateDriver::fullUpdate() {
  flushDirtyRegions(false);
  display->setFullWindow();
  display->display(false);
}

void DisplayTemplateDriver::updateVariable(
    const String& key, const String& value) {
#if defined(ESP32)
  xSemaphoreTake(mutex, portMAX_DELAY);
#endif

  vars.set(key, value);

  DoublyLinkedListNode<std::shared_ptr<Region>>* curr = regions.getHead();

  while (curr != NULL) {
    std::shared_ptr<Region> region = curr->data;

    if (region->getVariableName() == key) {
      if (region->updateValue(value)) {
        this->dirty = true;

        if (this->onRegionUpdateFn) {
          this->onRegionUpdateFn(region->getId(), key, region->getVariableValue(key));
        }
      }
    }

    curr = curr->next;
  }

  // Do not update timestamp
  if (this->onVariableUpdateFn && key != "timestamp") {
    this->onVariableUpdateFn(key, value);
  }

#if defined(ESP32)
  xSemaphoreGive(mutex);
#endif
}

void DisplayTemplateDriver::deleteVariable(const String& key) {
  updateVariable(key, "");
  vars.erase(key);
}

void DisplayTemplateDriver::setTemplate(const String& templateFilename) {
  this->newTemplate = templateFilename;
}

const String& DisplayTemplateDriver::getTemplateFilename() {
  return templateFilename;
}

void DisplayTemplateDriver::loadTemplate(const String& templateFilename) {
  if (!SPIFFS.exists(templateFilename)) {
    Serial.println(F("WARN - template file does not exist"));
    printError("Template file does not exist");

    return;
  }

  Serial.print(F("Loading template: "));
  Serial.println(templateFilename);

  File file = SPIFFS.open(templateFilename, "r");

  DynamicJsonDocument jsonBuffer(JSON_TEMPLATE_BUFFER_SIZE);
  deserializeJson(jsonBuffer, file);
  file.close();

  JsonObject tmpl = jsonBuffer.as<JsonObject>();

  Serial.print(F("Free heap - "));
  Serial.println(ESP.getFreeHeap());

  if (tmpl.isNull()) {
    Serial.println(F("WARN - could not parse template file"));
    printError("Could not parse template!");

    return;
  }

  display->fillScreen(parseColor(tmpl["background_color"]));

  if (tmpl.containsKey("rotation")) {
    display->setRotation(tmpl["rotation"]);
  }

  JsonVariant formatters = tmpl["formatters"];
  VariableFormatterFactory formatterFactory(formatters);

  JsonObject updateRects = tmpl["update_rects"];

  if (tmpl.containsKey("lines")) {
    renderLines(tmpl["lines"].as<JsonArray>());
  }

  if (tmpl.containsKey("bitmaps")) {
    renderBitmaps(formatterFactory, tmpl["bitmaps"]);
  }

  if (tmpl.containsKey("text")) {
    renderTexts(formatterFactory, updateRects, tmpl["text"].as<JsonArray>());
  }

  if (tmpl.containsKey("rectangles")) {
    renderRectangles(formatterFactory, tmpl["rectangles"].as<JsonArray>());
  }
}

std::shared_ptr<Region> DisplayTemplateDriver::addRectangleRegion(
    VariableFormatterFactory& formatterFactory, JsonObject spec, uint16_t index) {
  String variable = RectangleRegion::Dimension::extractVariable(spec);

  RectangleRegion::Dimension w =
      RectangleRegion::Dimension::fromSpec(spec["w"]);
  RectangleRegion::Dimension h =
      RectangleRegion::Dimension::fromSpec(spec["h"]);

  JsonObject formatterDefinition =
      RectangleRegion::Dimension::extractFormatterDefinition(spec);

  auto region = std::make_shared<RectangleRegion>(variable,
      spec["x"],
      spec["y"],
      w,
      h,
      extractColor(spec),
      formatterFactory.create(formatterDefinition),
      fillStyleFromString(spec["style"]),
      index);
  regions.add(region);
  region->updateValue(vars.get(variable));
  return region;
}

void DisplayTemplateDriver::renderRectangles(
    VariableFormatterFactory& formatterFactory, JsonArray rectangles) {
  size_t ix = 0;
  for (JsonObject rect : rectangles) {
    addRectangleRegion(formatterFactory, rect, ix++);
  }
}

void DisplayTemplateDriver::renderBitmap(const String& filename,
    uint16_t x,
    uint16_t y,
    uint16_t w,
    uint16_t h,
    uint16_t color) {
  if (!SPIFFS.exists(filename)) {
    Serial.print(F("WARN - tried to render bitmap file that doesn't exist: "));
    Serial.println(filename);
    return;
  }

  Serial.printf_P(PSTR("Rendering bitmap: %s\n"), filename.c_str());

  File file = SPIFFS.open(filename, "r");
  size_t size = w * h / 8;
  uint8_t bits[size];
  file.readBytes(reinterpret_cast<char*>(bits), size);

  file.close();

  display->fillRect(x, y, w, h, GxEPD_WHITE);
  display->drawBitmap(x, y, bits, w, h, color);
}

void DisplayTemplateDriver::renderBitmaps(
    VariableFormatterFactory& formatterFactory, JsonArray bitmaps) {
  for (size_t i = 0; i < bitmaps.size(); i++) {
    JsonObject bitmap = bitmaps[i];

    const uint16_t x = bitmap["x"];
    const uint16_t y = bitmap["y"];
    const uint16_t w = bitmap["w"];
    const uint16_t h = bitmap["h"];
    const uint16_t color = extractColor(bitmap);

    // v2 format where there is an explicit "value" key
    if (bitmap.containsKey("value")) {
      bitmap = bitmap["value"];

      if (bitmap["type"] == "static") {
        renderBitmap(bitmap["value"].as<const char*>(), x, y, w, h, color);
        continue;
      }
      // fall back on v1 format where "static" and "variable" are inline with
      // the definition
    } else {
      if (bitmap.containsKey("static")) {
        renderBitmap(bitmap["static"].as<const char*>(), x, y, w, h, color);
        continue;
      }
    }

    if (bitmap.containsKey("variable")) {
      const String& variable = bitmap["variable"];
      std::shared_ptr<Region> region =
          addBitmapRegion(x, y, w, h, color, formatterFactory, bitmap, i);
      region->updateValue(vars.get(variable));
    }
  }
}

void DisplayTemplateDriver::renderTexts(
    VariableFormatterFactory& formatterFactory,
    JsonObject updateRects,
    JsonArray texts) {
  for (size_t i = 0; i < texts.size(); i++) {
    JsonObject text = texts[i];

    uint16_t x = text["x"];
    uint16_t y = text["y"];
    auto font = parseFont(text["font"]);
    auto color = extractColor(text);
    auto textSize = extractTextSize(text);

    // Font should be set first because it fiddles with the cursor.
    display->setFont(font);
    display->setCursor(x, y);
    display->setTextSize(textSize);
    display->setTextColor(color);

    // v2 format where there is an explicit "value" key
    if (text.containsKey("value")) {
      text = text["value"];

      if (text["type"] == "static") {
        display->print(text["value"].as<const char*>());
      }
      // fall back on v1 format where "static" and "variable" are inline with
      // the definition
    } else {
      if (text.containsKey("static")) {
        display->print(text["static"].as<const char*>());
      }
    }

    if (text.containsKey("variable")) {
      const String& variable = text["variable"].as<const char*>();
      auto formatter = formatterFactory.create(text);

      std::shared_ptr<Region> region = addTextRegion(x,
          y,
          color,
          font,
          textSize,
          formatter,
          updateRects,
          text,
          i);
      region->updateValue(vars.get(variable));
    }
  }
}

void DisplayTemplateDriver::renderLines(JsonArray lines) {
  for (JsonArray::iterator it = lines.begin(); it != lines.end(); ++it) {
    JsonObject line = it->as<JsonObject>();

    display->writeLine(line["x1"],
        line["y1"],
        line["x2"],
        line["y2"],
        extractColor(line));
  }
}

std::shared_ptr<Region> DisplayTemplateDriver::addBitmapRegion(uint16_t x,
    uint16_t y,
    uint16_t w,
    uint16_t h,
    uint16_t color,
    VariableFormatterFactory& formatterFactory,
    JsonObject spec,
    uint16_t index) {
  std::shared_ptr<Region> region = std::make_shared<BitmapRegion>(
    spec["variable"].as<const char*>(),
    x,
    y,
    w,
    h,
    color,
    formatterFactory.create(spec),
    index
  );
  regions.add(region);

  return region;
}

std::shared_ptr<Region> DisplayTemplateDriver::addTextRegion(uint16_t x,
    uint16_t y,
    uint16_t color,
    const GFXfont* font,
    uint8_t textSize,
    std::shared_ptr<const VariableFormatter> formatter,
    JsonObject updateRects,
    JsonObject spec,
    uint16_t index) {
  auto region = std::make_shared<TextRegion>(spec["variable"].as<const char*>(),
      x,
      y,
      nullptr,  // fixed bound -- deprecated
      color,
      font,
      formatter,
      textSize,
      index);
  regions.add(region);

  return region;
}

void DisplayTemplateDriver::printError(const char* message) {
  Serial.printf_P(PSTR("Printing error to screen: %s\n"), message);

  display->fillScreen(GxEPD_BLACK);
  display->setFont(&FreeMonoBold9pt7b);
  display->setTextColor(GxEPD_WHITE);
  display->setCursor(0, display->height() / 2);
  display->print(message);
  display->display(false);
}

const GFXfont* DisplayTemplateDriver::parseFont(const String& fontName) {
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

const uint16_t DisplayTemplateDriver::parseColor(const String& colorName) {
  if (colorName.equalsIgnoreCase("black")) {
    return GxEPD_BLACK;
  } else if (colorName.equalsIgnoreCase("red")) {
    return GxEPD_RED;
  } else {
    return GxEPD_WHITE;
  }
}

const uint8_t DisplayTemplateDriver::extractTextSize(JsonObject spec) {
  if (spec.containsKey("font_size")) {
    return spec["font_size"];
  } else {
    return 1;
  }
}

const uint16_t DisplayTemplateDriver::extractColor(JsonObject spec) {
  if (spec.containsKey("color")) {
    return parseColor(spec["color"]);
  } else {
    return defaultColor;
  }
}

void DisplayTemplateDriver::resolveVariables(
    JsonArray toResolve, JsonArray response) {
  File file = SPIFFS.open(templateFilename, "r");
  DynamicJsonDocument jsonBuffer(JSON_TEMPLATE_BUFFER_SIZE);
  auto error = deserializeJson(jsonBuffer, file);
  file.close();

  if (error) {
    Serial.print(F("Error parsing template file: "));
    Serial.println(error.c_str());
    return;
  }

  JsonObject tmpl = jsonBuffer.as<JsonObject>();

  if (tmpl.isNull()) {
    return;
  }

  JsonVariant formatters = tmpl["formatters"];
  VariableFormatterFactory formatterFactory(formatters);

  for (JsonArray var : toResolve) {
    String name = var[0];
    String value = vars.get(name);

    auto formatter = formatterFactory.create(var[1]);

    JsonObject resolvedVar = response.createNestedObject();
    resolvedVar["k"] = name;
    resolvedVar["v"] = formatter->format(value);
    resolvedVar["ref"] = var[2];
  }
}

void DisplayTemplateDriver::dumpRegionValues(JsonObject response) {
  auto head = regions.getHead();

  while (head) {
    auto region = head->data;
    JsonArray data = response.createNestedArray(region->getId());
    region->dumpResolvedDefinition(data);
    head = head->next;
  }
}

void DisplayTemplateDriver::onVariableUpdate(VariableUpdateObserverFn fn) {
  this->onVariableUpdateFn = fn;
}

void DisplayTemplateDriver::onRegionUpdate(RegionUpdateObserverFn fn) {
  this->onRegionUpdateFn = fn;
}