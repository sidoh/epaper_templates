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

// ESP32 needs to include a SPIFFS library.  ESP8266 has it baked into FS.h
#if defined(ESP32)
#include <SPIFFS.h>
#endif

#if defined(ESP8266)
#define FILE_WRITE "w"
#endif
