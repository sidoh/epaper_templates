#include <Region.h>

#include <GxEPD2_EPD.h>
#include <GxEPD2_GFX.h>
#include <Adafruit_GFX.h>

#include <memory>

#ifndef _TEXT_REGION_H
#define _TEXT_REGION_H

class TextRegion : public Region {
public:
  TextRegion(
    const String& variable,
    uint16_t x,
    uint16_t y,
    std::shared_ptr<Rectangle> fixedBoundingBox,
    uint16_t color,
    const GFXfont* font,
    std::shared_ptr<const VariableFormatter> formatter
  );
  ~TextRegion();

  virtual void render(GxEPD2_GFX* display);
  virtual Rectangle getBoundingBox();

protected:
  const GFXfont* font;

  // Users can optionally manually specify a bounding rectangle.
  std::shared_ptr<Rectangle> fixedBound;

  // Track current bounding box start coordinates separately from (x, y), which
  // is the position we set the cursor at.
  Rectangle currentBound;

  // Previous bounding box coordinates
  Rectangle previousBound;
};

#endif
