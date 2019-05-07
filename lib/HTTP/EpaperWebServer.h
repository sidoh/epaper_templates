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

using RichHttpConfig = RichHttp::Generics::Configs::AsyncWebServer;
using RequestContext = RichHttpConfig::RequestContextType;

class EpaperWebServer {
public:
  EpaperWebServer(DisplayTemplateDriver*& driver, Settings& settings);
  ~EpaperWebServer();

  void begin();
  uint16_t getPort() const;

private:

  RichHttpServer<RichHttpConfig> server;
  DisplayTemplateDriver*& driver;
  Settings& settings;
  uint16_t port;

  // Variables CRUD
  void handleUpdateVariables(RequestContext& request);

  void handleNoOp();

  // General info routes
  void handleAbout(RequestContext& request);

  // General helpers
  void handleListDirectory(const char* dir, RequestContext& request);
  void handleCreateFile(const char* filePrefix, RequestContext& request);
  void handleDeleteFile(const String& file, RequestContext& request);

  // CRUD handlers for Bitmaps
  void handleDeleteBitmap(RequestContext& request);
  void handleShowBitmap(RequestContext& request);

  // CRUD handlers for Templates
  void handleDeleteTemplate(RequestContext& request);
  void handleShowTemplate(RequestContext& request);
  void handleUpdateTemplate(RequestContext& request);

  void handleUpdateSettings(RequestContext& request);

  // Misc helpers
  void handleUpdateFile(ArUploadHandlerFunction* request, const char* filename);
  void handleServeFile(
    const char* filename,
    const char* contentType,
    const char* defaultText,
    RequestContext& request
  );
  void handleServeGzip_P(
    const char* contentType,
    const uint8_t* text,
    size_t length,
    RequestContext& request
  );
  void _handleServeGzip_P(
    const char* contentType,
    const uint8_t* text,
    size_t length,
    AsyncWebServerRequest* request
  );
  bool serveFile(const char* file, const char* contentType, RequestContext& request);
  void handleUpdateJsonFile(const String& file, RequestContext& request);
};

#endif
