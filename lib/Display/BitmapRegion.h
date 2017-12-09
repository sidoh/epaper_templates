#include <Region.h>

#if defined(ESP32)
#include <SPIFFS.h>
#endif

#ifndef _BITMAP_REGION
#define _BITMAP_REGION

class BitmapRegion : public Region {
public:
  BitmapRegion(
    const String& variable,
    uint16_t x,
    uint16_t y,
    uint16_t w,
    uint16_t h,
    uint16_t color,
    std::shared_ptr<const VariableFormatter> formatter
  );
  ~BitmapRegion();

  virtual void render(GxEPD* display);
};

#endif
