#include <Arduino.h>
#include <stddef.h>
#include <memory>
#include <VariableFormatters.h>
#include <GxEPD2_GFX.h>

#ifndef _REGIONS_H
#define _REGIONS_H

struct Rectangle {
  uint16_t x, y, w, h;

  inline static uint16_t roundUp(uint16_t num, uint16_t base = 8) {
    return ((num + base - 1) / base) * base;
  }

  inline static uint16_t roundDown(uint16_t num, uint16_t base = 8) {
    if (num < base) {
      return 0;
    }
    return (num / base) * base;
  }

  // Since partial updates for displays are byte-aligned, we round to the nearest
  // multiple of 8:
  //
  // * For lower bounds, round down to the nearest multiple of 8
  // * For upper, round up.  If the lower bounds were rounded down, stretch the
  //   upper bounds by the same amount.
  Rectangle rounded() {
    uint16_t roundedX = Rectangle::roundDown(x);
    uint16_t roundedY = Rectangle::roundDown(y);

    // If the starting bound is rounded down, the corresponding length dimension
    // should be increased by the same amount the original value was rounded
    uint16_t roundedW = Rectangle::roundUp(w + (x - roundedX));
    uint16_t roundedH = Rectangle::roundUp(h + (y - roundedY));

    return {
      .x = roundedX,
      .y = roundedY,
      .w = roundedW,
      .h = roundedH
    };
  }
};

class Region {
public:
  Region(
    const String& variable,
    Rectangle boundingBox,
    uint16_t color,
    std::shared_ptr<const VariableFormatter> formatter
  );
  ~Region();

  virtual bool updateValue(const String& value);
  virtual void render(GxEPD2_GFX* display) = 0;

  virtual Rectangle updateScreen(GxEPD2_GFX* display);
  virtual bool isDirty() const;
  virtual void clearDirty();
  virtual const String& getVariableName() const;
  virtual Rectangle getBoundingBox();

protected:
  const String variable;
  String variableValue;
  Rectangle boundingBox;
  uint16_t color;
  bool dirty;
  std::shared_ptr<const VariableFormatter> formatter;
};

#endif
