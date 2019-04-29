#include <ESPAsyncWebServer.h>
#include <FS.h>
#include <DisplayTemplateDriver.h>
#include <Settings.h>
#include <RichHttpServer.h>

#if defined(ESP32)
#include <SPIFFS.h>
#endif

#ifndef _EPAPER_WEB_SERVER_H
#define _EPAPER_WEB_SERVER_H

class EpaperWebServer {
public:
  EpaperWebServer(DisplayTemplateDriver*& driver, Settings& settings);
  ~EpaperWebServer();

  void begin();
  uint16_t getPort() const;

private:

  RichHttpServer server;
  DisplayTemplateDriver*& driver;
  Settings& settings;
  uint16_t port;

  // Variables CRUD
  void handleUpdateVariables(
    AsyncWebServerRequest* request,
    uint8_t* data,
    size_t len,
    size_t index,
    size_t total
  );

  void handleStaticResponse_P(AsyncWebServerRequest* request, int responseCode, const char* responseType, const char* message);
  void handleNoOp(AsyncWebServerRequest* request);

  // General info routes
  void handleAbout(AsyncWebServerRequest* request);

  // OTA
  void handleOtaUpdate(
    AsyncWebServerRequest* request,
    const String &filename,
    size_t index,
    uint8_t *data,
    size_t len,
    bool isFinal
  );
  void handleOtaSuccess(AsyncWebServerRequest* request);

  // General helpers
  void handleListDirectory(const char* dir, AsyncWebServerRequest* request);
  void handleCreateFile(
    const char* filePrefix,
    AsyncWebServerRequest* request,
    const String &filename,
    size_t index,
    uint8_t *data,
    size_t len,
    bool isFinal
  );

  // CRUD handlers for Bitmaps
  void handleDeleteBitmap(AsyncWebServerRequest* request, const UrlTokenBindings* bindings);
  void handleShowBitmap(AsyncWebServerRequest* request, const UrlTokenBindings* bindings);

  // CRUD handlers for Templates
  void handleDeleteTemplate(AsyncWebServerRequest* request, const UrlTokenBindings* bindings);
  void handleShowTemplate(AsyncWebServerRequest* request, const UrlTokenBindings* bindings);
  void handleUpdateTemplate(
    AsyncWebServerRequest* request,
    uint8_t* data,
    size_t len,
    size_t index,
    size_t total,
    const UrlTokenBindings* bindings
  );

  void handleUpdateSettings(
    AsyncWebServerRequest* request,
    uint8_t* data,
    size_t len,
    size_t index,
    size_t total
  );
  void handleListSettings(AsyncWebServerRequest* request);

  // Misc helpers
  void handleUpdateFile(ArUploadHandlerFunction* request, const char* filename);
  void handleServeFile(
    AsyncWebServerRequest* request,
    const char* filename,
    const char* contentType,
    const char* defaultText = ""
  );
  void handleServeGzip_P(
    AsyncWebServerRequest* request,
    const char* contentType,
    const uint8_t* text,
    size_t length
  );
  bool serveFile(AsyncWebServerRequest* request, const char* file, const char* contentType);
  void handleUpdateJsonFile(const String& file, AsyncWebServerRequest* request, uint8_t* data, size_t len);
};

#endif
