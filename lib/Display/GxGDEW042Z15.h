/************************************************************************************
   class GxGDEW042Z15 : Display class example for GDEW027C44 e-Paper from Dalian Good Display Co., Ltd.: www.good-display.com

   based on Demo Example from Good Display, available here: http://www.good-display.com/download_detail/downloadsId=519.html

   Author : J-M Zingg

   modified by :

   Version : 2.2

   Support: limited, provided as example, no claim to be fit for serious use

   Controller: IL91874 : http://www.good-display.com/download_detail/downloadsId=539.html

   connection to the e-Paper display is through DESTM32-S2 connection board, available from Good Display

   DESTM32-S2 pinout (top, component side view):
         |-------------------------------------------------
         |  VCC  |o o| VCC 5V  not needed
         |  GND  |o o| GND
         |  3.3  |o o| 3.3     3.3V
         |  nc   |o o| nc
         |  nc   |o o| nc
         |  nc   |o o| nc
   MOSI  |  DIN  |o o| CLK     SCK
   SS    |  CS   |o o| DC      e.g. D3
   D4    |  RST  |o o| BUSY    e.g. D2
         |  nc   |o o| BS      GND
         |-------------------------------------------------

   note: for correct red color jumper J3 must be set on 0.47 side (towards FCP connector)

*/
#ifndef _GxGDEW042Z15_H_
#define _GxGDEW042Z15_H_

#define PANEL_SETTING                               0x00
#define POWER_SETTING                               0x01
#define POWER_OFF                                   0x02
#define POWER_OFF_SEQUENCE_SETTING                  0x03
#define POWER_ON                                    0x04
#define POWER_ON_MEASURE                            0x05
#define BOOSTER_SOFT_START                          0x06
#define DEEP_SLEEP                                  0x07
#define DATA_START_TRANSMISSION_1                   0x10
#define DATA_STOP                                   0x11
#define DISPLAY_REFRESH                             0x12
#define DATA_START_TRANSMISSION_2                   0x13
#define LUT_FOR_VCOM                                0x20
#define LUT_WHITE_TO_WHITE                          0x21
#define LUT_BLACK_TO_WHITE                          0x22
#define LUT_WHITE_TO_BLACK                          0x23
#define LUT_BLACK_TO_BLACK                          0x24
#define PLL_CONTROL                                 0x30
#define TEMPERATURE_SENSOR_COMMAND                  0x40
#define TEMPERATURE_SENSOR_SELECTION                0x41
#define TEMPERATURE_SENSOR_WRITE                    0x42
#define TEMPERATURE_SENSOR_READ                     0x43
#define VCOM_AND_DATA_INTERVAL_SETTING              0x50
#define LOW_POWER_DETECTION                         0x51
#define TCON_SETTING                                0x60
#define RESOLUTION_SETTING                          0x61
#define GSST_SETTING                                0x65
#define GET_STATUS                                  0x71
#define AUTO_MEASUREMENT_VCOM                       0x80
#define READ_VCOM_VALUE                             0x81
#define VCM_DC_SETTING                              0x82
#define PARTIAL_WINDOW                              0x90
#define PARTIAL_IN                                  0x91
#define PARTIAL_OUT                                 0x92
#define PROGRAM_MODE                                0xA0
#define ACTIVE_PROGRAMMING                          0xA1
#define READ_OTP                                    0xA2
#define POWER_SAVING                                0xE3

#include "GxEPD.h"

#define GxGDEW042Z15_WIDTH 400
#define GxGDEW042Z15_HEIGHT 300

#define GxGDEW042Z15_BUFFER_SIZE (uint32_t(GxGDEW042Z15_WIDTH) * uint32_t(GxGDEW042Z15_HEIGHT) / 8)

// divisor for AVR, should be factor of GxGDEW042Z15_HEIGHT
#define GxGDEW042Z15_PAGES 20

#define GxGDEW042Z15_PAGE_HEIGHT (GxGDEW042Z15_HEIGHT / GxGDEW042Z15_PAGES)
#define GxGDEW042Z15_PAGE_SIZE (GxGDEW042Z15_BUFFER_SIZE / GxGDEW042Z15_PAGES)

// mapping suggestion from Waveshare 2.7inch e-Paper to Wemos D1 mini
// BUSY -> D2, RST -> D4, DC -> D3, CS -> D8, CLK -> D5, DIN -> D7, GND -> GND, 3.3V -> 3.3V

// mapping suggestion for ESP32, e.g. LOLIN32, see .../variants/.../pins_arduino.h for your board
// NOTE: there are variants with different pins for SPI ! CHECK SPI PINS OF YOUR BOARD
// BUSY -> 4, RST -> 16, DC -> 17, CS -> SS(5), CLK -> SCK(18), DIN -> MOSI(23), GND -> GND, 3.3V -> 3.3V

// mapping suggestion for AVR, UNO, NANO etc.
// BUSY -> 7, RST -> 9, DC -> 8, CS-> 10, CLK -> 13, DIN -> 11

class GxGDEW042Z15 : public GxEPD
{
  public:
#if defined(ESP8266)
    //GxGDEW042Z15(GxIO& io, uint8_t rst = D4, uint8_t busy = D2);
    // use pin numbers, other ESP8266 than Wemos may not use Dx names
    GxGDEW042Z15(GxIO& io, uint8_t rst = 2, uint8_t busy = 4);
#else
    GxGDEW042Z15(GxIO& io, uint8_t rst = 9, uint8_t busy = 7);
#endif
    void drawPixel(int16_t x, int16_t y, uint16_t color);
    void init(void);
    void fillScreen(uint16_t color); // to buffer
    void update(void);
    // to buffer, may be cropped, drawPixel() used, update needed
    void  drawBitmap(const uint8_t *bitmap, uint16_t x, uint16_t y, uint16_t w, uint16_t h, uint16_t color, int16_t mode = bm_normal);
    // to full screen, filled with white if size is less, no update needed, black  /white / red, for example bitmaps
    void drawExamplePicture(const uint8_t* black_bitmap, const uint8_t* red_bitmap, uint32_t black_size, uint32_t red_size);
    // to full screen, filled with white if size is less, no update needed, black  /white / red, general version
    void drawPicture(const uint8_t* black_bitmap, const uint8_t* red_bitmap, uint32_t black_size, uint32_t red_size, int16_t mode = bm_normal);
    // to full screen, filled with white if size is less, no update needed
    void drawBitmap(const uint8_t *bitmap, uint32_t size, int16_t mode = bm_normal); // only bm_normal, bm_invert modes implemented
    void eraseDisplay(bool using_partial_update = false); // parameter ignored
    // terminate cleanly, not needed as all screen drawing methods of this class do power down
    void powerDown();
    // paged drawing, for limited RAM, drawCallback() is called GxGDEW042Z15_PAGES times
    // each call of drawCallback() should draw the same
    void drawPaged(void (*drawCallback)(void));
    void drawPaged(void (*drawCallback)(uint32_t), uint32_t);
    void drawPaged(void (*drawCallback)(const void*), const void*);
    void drawPaged(void (*drawCallback)(const void*, const void*), const void*, const void*);
    void drawCornerTest(uint8_t em = 0x01);
    void updateWindow(uint16_t x, uint16_t y, uint16_t w, uint16_t h, bool usingRotation = true);
  private:
    void _writeData(uint8_t data);
    void _writeCommand(uint8_t command);
    void _wakeUp();
    void _sleep();
    void _waitWhileBusy(const char* comment = 0);
  private:
#if defined(__AVR)
    uint8_t _black_buffer[GxGDEW042Z15_PAGE_SIZE];
    uint8_t _red_buffer[GxGDEW042Z15_PAGE_SIZE];
#else
    uint8_t _black_buffer[GxGDEW042Z15_BUFFER_SIZE];
    uint8_t _red_buffer[GxGDEW042Z15_BUFFER_SIZE];
#endif
    GxIO& IO;
    int16_t _current_page;
    uint8_t _rst;
    uint8_t _busy;
#if defined(ESP8266) || defined(ESP32)
  public:
    // the compiler of these packages has a problem with signature matching to base classes
    void drawBitmap(int16_t x, int16_t y, const uint8_t bitmap[], int16_t w, int16_t h, uint16_t color)
    {
      Adafruit_GFX::drawBitmap(x, y, bitmap, w, h, color);
    };
#endif
};

#define GxEPD_Class GxGDEW042Z15

#define GxEPD_WIDTH GxGDEW042Z15_WIDTH
#define GxEPD_HEIGHT GxGDEW042Z15_HEIGHT
#define GxEPD_BitmapExamples <GxGDEW042Z15/BitmapExamples.h>
#define GxEPD_BitmapExamplesQ "GxGDEW042Z15/BitmapExamples.h"

#endif
