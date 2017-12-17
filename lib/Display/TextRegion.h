#include <Region.h>
#include <Adafruit_GFX.h>

#ifndef _TEXT_REGION_H
#define _TEXT_REGION_H

class TextRegion : public Region {
public:
  TextRegion(
    const String& variable,
    uint16_t x,
    uint16_t y,
    int16_t fixedBbX,
    int16_t fixedBbY,
    int16_t fixedBbW,
    int16_t fixedBbH,
    uint16_t color,
    const GFXfont* font,
    std::shared_ptr<const VariableFormatter> formatter
  );
  ~TextRegion();

  virtual void render(GxEPD* display);
  virtual void getBoundingBox(uint16_t& x, uint16_t& y, uint16_t& w, uint16_t& h);

protected:
  const GFXfont* font;

  // Track current bounding box start coordinates separately from (x, y), which
  // is the position we set the cursor at.
  uint16_t bbX;
  uint16_t bbY;

  // Users can optionally manually specify a bounding rectangle.  If the values are
  // negative, use computed values.
  int16_t fixedBbX;
  int16_t fixedBbY;
  int16_t fixedBbW;
  int16_t fixedBbH;

  // Previous bounding box coordinates
  uint16_t prevX;
  uint16_t prevY;
  uint16_t prevW;
  uint16_t prevH;
};

#endif
