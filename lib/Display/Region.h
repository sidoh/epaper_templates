#include <Arduino.h>
#include <stddef.h>
#include <memory>
#include <VariableFormatters.h>
#include <GxEPD.h>

#ifndef _REGIONS_H
#define _REGIONS_H

class Region {
public:
  Region(
    const String& variable,
    uint16_t x,
    uint16_t y,
    uint16_t w,
    uint16_t h,
    uint16_t color,
    std::shared_ptr<const VariableFormatter> formatter
  );
  ~Region();

  virtual bool updateValue(const String& value);
  virtual void render(GxEPD* display) = 0;

  virtual void updateScreen(GxEPD* display);
  virtual bool isDirty() const;
  virtual void clearDirty();
  virtual const String& getVariableName() const;
  virtual void getBoundingBox(uint16_t& x, uint16_t& y, uint16_t& w, uint16_t& h);

protected:
  const String variable;
  String variableValue;
  uint16_t x;
  uint16_t y;
  uint16_t w;
  uint16_t h;
  uint16_t color;
  bool dirty;
  std::shared_ptr<const VariableFormatter> formatter;
};

#endif
