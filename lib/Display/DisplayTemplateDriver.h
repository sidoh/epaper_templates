#include <ArduinoJson.h>
#include <BitmapRegion.h>
#include <DoublyLinkedList.h>
#include <EnvironmentConfig.h>
#include <FS.h>
#include <GxEPD2_BW.h>
#include <RectangleRegion.h>
#include <Settings.h>
#include <TextRegion.h>
#include <VariableDictionary.h>
#include <VariableFormatters.h>
#include <gfxfont.h>

#include <memory>

#if defined(ESP32)
#include <SPIFFS.h>
extern "C" {
#include "freertos/semphr.h"
}
#endif

#ifndef _DRIVER_H
#define _DRIVER_H

#ifndef TEXT_BOUNDING_BOX_PADDING
#define TEXT_BOUNDING_BOX_PADDING 5
#endif

#include <Fonts/FreeMono9pt7b.h>
#include <Fonts/FreeMonoBold12pt7b.h>
#include <Fonts/FreeMonoBold18pt7b.h>
#include <Fonts/FreeMonoBold24pt7b.h>
#include <Fonts/FreeMonoBold9pt7b.h>
#include <Fonts/FreeSans18pt7b.h>
#include <Fonts/FreeSans24pt7b.h>
#include <Fonts/FreeSans9pt7b.h>
#include <Fonts/FreeSansBold9pt7b.h>

#include <memory>

class DisplayTemplateDriver {
 public:
  DisplayTemplateDriver(GxEPD2_GFX* display, Settings& settings);

  // Updates the value for the given variable, and marks any regions bound to
  // that variable as dirty.
  void updateVariable(const String& name, const String& value);
  void deleteVariable(const String& name);

  // Helper to resolve variable values (used in REST API)
  void resolveVariables(JsonArray toResolve, JsonArray response);
  // Helper to return all current variable values
  void dumpRegionValues(JsonObject response);

  // Sets the JSON template to load from SPIFFS.  Clears any regions that may
  // have been parsed from the previous template.
  void setTemplate(const String& filename);
  const String& getTemplateFilename();

  // Performs a full update of the display.  Applies the template and refreshes
  // the entire screen.
  void fullUpdate();

  // Performs a full update on the next call of loop().
  void scheduleFullUpdate();

  // Updates the display by checking for regions that have been marked as dirty
  // and performing partial updates on the bounding boxes.
  void loop();

  void init();

 private:
  GxEPD2_GFX* display;
  VariableDictionary vars;
  String templateFilename;
  Settings& settings;
  String newTemplate;

  DoublyLinkedList<std::shared_ptr<Region>> regions;

  bool dirty;
  bool shouldFullUpdate;
  time_t lastFullUpdate;

#if defined(ESP32)
  SemaphoreHandle_t mutex;
#endif

  const uint16_t defaultColor = GxEPD_BLACK;
  const GFXfont* defaultFont = &FreeSans9pt7b;

  void flushDirtyRegions(bool screenUpdates);
  void clearDirtyRegions();
  void printError(const char* message);
  void loadTemplate(const String& templateFilename);

  void renderLines(JsonArray lines);
  void renderRectangles(VariableFormatterFactory& formatterFactory,
                        JsonArray lines);
  void renderTexts(VariableFormatterFactory& formatterFactory,
                   JsonObject updateRects,
                   JsonArray text);
  void renderBitmaps(VariableFormatterFactory& formatterFactory,
                     JsonArray bitmaps);
  void renderBitmap(const String& filename,
                    uint16_t x,
                    uint16_t y,
                    uint16_t w,
                    uint16_t h,
                    uint16_t color);

  std::shared_ptr<Region> addTextRegion(
      uint16_t x,
      uint16_t y,
      uint16_t color,
      const GFXfont* font,
      uint8_t textSize,
      std::shared_ptr<const VariableFormatter> formatter,
      JsonObject updateRects,
      JsonObject spec,
      uint16_t index);
  std::shared_ptr<Region> addBitmapRegion(
      uint16_t x,
      uint16_t y,
      uint16_t w,
      uint16_t h,
      uint16_t color,
      VariableFormatterFactory& formatterFactory,
      JsonObject spec,
      uint16_t index);
  std::shared_ptr<Region> addRectangleRegion(
      VariableFormatterFactory& formatterFactory,
      JsonObject spec,
      uint16_t index);

  const uint16_t parseColor(const String& colorName);
  const GFXfont* parseFont(const String& fontName);
  const uint16_t extractColor(JsonObject spec);
  const uint8_t extractTextSize(JsonObject spec);

  static bool regionContainedIn(Rectangle& r,
                                DoublyLinkedList<Rectangle>& others);
};

#endif
