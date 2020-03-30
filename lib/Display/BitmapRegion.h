#include <Region.h>
#include <EnvironmentConfig.h>

#include <GxEPD2_EPD.h>
#include <GxEPD2_GFX.h>

#include <memory>

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
    uint16_t background_color,
    std::shared_ptr<const VariableFormatter> formatter,
    uint16_t index
  );
  ~BitmapRegion();

  virtual void render(GxEPD2_GFX* display);
};

#endif
