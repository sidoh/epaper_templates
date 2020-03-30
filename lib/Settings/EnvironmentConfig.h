// Platform independent macro to generate a unique(ish) device ID
#if defined(ESP8266)
  extern "C" {
    #include "user_interface.h"
  }
  #define ESP_CHIP_ID() (ESP.getChipId())
#elif defined(ESP32)
  #include <esp_wifi.h>
  #define ESP_CHIP_ID() (static_cast<uint32_t>(ESP.getEfuseMac()))
#endif

#if defined(ESP8266)
#include <Ticker.h>
#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#elif defined(ESP32)
#include <WiFi.h>
#include <ESPmDNS.h>
extern "C" {
	#include "freertos/FreeRTOS.h"
	#include "freertos/timers.h"
}
#endif

// ESP32 needs to include a SPIFFS library.  ESP8266 has it baked into FS.h
#if defined(ESP32)
#include <SPIFFS.h>
#endif

#if defined(ESP8266)
#define FILE_WRITE "w"
#endif

// Default pin configs
#if defined(ESP8266)
#define EPD_DEFAULT_DC_PIN D3
#define EPD_DEFAULT_RST_PIN D4
#define EPD_DEFAULT_BUSY_PIN 4
#elif defined(ESP32)
#define EPD_DEFAULT_SPI_BUS HSPI // HSPI == 2 | VSPI == 3
#define EPD_DEFAULT_DC_PIN 17
#define EPD_DEFAULT_RST_PIN 16
#define EPD_DEFAULT_BUSY_PIN 7
#endif
