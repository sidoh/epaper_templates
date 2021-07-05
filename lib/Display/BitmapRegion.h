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
    uint16_t backgroundColor,
    std::shared_ptr<const VariableFormatter> formatter,
    uint16_t index
  );
  ~BitmapRegion();

  virtual void render(GxEPD2_GFX* display);
  virtual Rectangle getBoundingBox();
  static bool getBitmapDimensions(
    const String& bitmapName,
    uint16_t *width, 
    uint16_t *height);

private:
  uint16_t backgroundColor;
protected:
  // Previous bounding box coordinates
  Rectangle previousBound;
};

#endif
