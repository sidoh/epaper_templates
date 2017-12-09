#include <FS.h>
#include <GxEPD.h>
#include <gfxfont.h>
#include <ArduinoJson.h>
#include <memory>
#include <TextRegion.h>
#include <BitmapRegion.h>

#include <VariableDictionary.h>
#include <LinkedList.h>
#include <Settings.h>
#include <VariableFormatters.h>

#ifndef _DRIVER_H
#define _DRIVER_H

#ifndef TEXT_BOUNDING_BOX_PADDING
#define TEXT_BOUNDING_BOX_PADDING 5
#endif

#include <Fonts/FreeMonoBold9pt7b.h>
#include <Fonts/FreeMonoBold12pt7b.h>
#include <Fonts/FreeMonoBold18pt7b.h>
#include <Fonts/FreeMonoBold24pt7b.h>
#include <Fonts/FreeSans9pt7b.h>
#include <Fonts/FreeSans18pt7b.h>
#include <Fonts/FreeSans24pt7b.h>
#include <Fonts/FreeSansBold9pt7b.h>
#include <Fonts/FreeMono9pt7b.h>

class DisplayTemplateDriver {
public:
  DisplayTemplateDriver(
    GxEPD* display,
    Settings& settings
  );

  // Updates the value for the given variable, and marks any regions bound to
  // that variable as dirty.
  void updateVariable(const String& name, const String& value);

  // Sets the JSON template to load from SPIFFS.  Clears any regions that may
  // have been parsed from the previous template.
  void setTemplate(const String& filename);
  const String& getTemplateFilename();

  // Relaods and parses the template file from flash.
  void loadTemplate();

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
  GxEPD* display;
  VariableDictionary vars;
  String templateFilename;
  Settings& settings;

  LinkedList<std::shared_ptr<Region>> regions;

  bool dirty;
  bool shouldFullUpdate;
  time_t lastFullUpdate;

  const uint16_t defaultColor = GxEPD_BLACK;
  const GFXfont* defaultFont = &FreeSans9pt7b;

  void flushDirtyRegions(bool screenUpdates);
  void clearDirtyRegions();
  void printError(const char* message);

  void renderLines(JsonArray& lines);
  void renderTexts(JsonArray& text);
  void renderBitmaps(JsonArray& bitmaps);
  void renderBitmap(const String& filename, uint16_t x, uint16_t y, uint16_t w, uint16_t h, uint16_t color);

  std::shared_ptr<Region> addTextRegion(const JsonObject& spec);
  std::shared_ptr<Region> addBitmapRegion(const JsonObject& spec);

  const uint16_t parseColor(const String& colorName);
  const GFXfont* parseFont(const String& fontName);
  const uint16_t extractColor(const JsonObject& spec);
};

#endif
