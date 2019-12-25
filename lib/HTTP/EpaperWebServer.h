#include <ESPAsyncWebServer.h>
#include <FS.h>
#include <DisplayTemplateDriver.h>
#include <Settings.h>
#include <RichHttpServer.h>
#include <functional>

#if defined(ESP32)
#include <SPIFFS.h>
#endif

#ifndef _EPAPER_WEB_SERVER_H
#define _EPAPER_WEB_SERVER_H

using RichHttpConfig = RichHttp::Generics::Configs::AsyncWebServer;
using RequestContext = RichHttpConfig::RequestContextType;

class EpaperWebServer {
public:
  using OnChangeFn = std::function<void()>;

  EpaperWebServer(DisplayTemplateDriver*& driver, Settings& settings);
  ~EpaperWebServer();

  void onSettingsChange(OnChangeFn changeFn);
  void begin();
  uint16_t getPort() const;
  void handleClient();

private:
  DisplayTemplateDriver*& driver;
  Settings& settings;
  PassthroughAuthProvider<WebSettings> authProvider;
  RichHttpServer<RichHttpConfig> server;
  uint16_t port;
  OnChangeFn changeFn;
  AsyncWebSocket wsServer;

  // Variable update observer
  void handleVariableUpdate(const String& name, const String& value);

  // Variables CRUD
  void handleUpdateVariables(RequestContext& request);
  void handleDeleteVariable(RequestContext& request);
  void handleGetFormattedVariables(RequestContext& request);

  void handleNoOp(RequestContext& request);

  // General info routes
  void handleGetSystem(RequestContext& request);
  void handlePostSystem(RequestContext& request);

  // General helpers
  void handleListDirectory(const char* dir, RequestContext& request);
  void handleCreateFile(const char* filePrefix, RequestContext& request);
  void handleDeleteFile(const String& file, RequestContext& request);
  void listDirectory(const char* dir, JsonArray result);

  // CRUD handlers for Bitmaps
  void handleDeleteBitmap(RequestContext& request);
  void handleShowBitmap(RequestContext& request);
  void handleCreateBitmap(RequestContext& request);
  void handleCreateBitmapFinish(RequestContext& request);
  void handleListBitmaps(RequestContext& request);

  // CRUD handlers for Templates
  void handleDeleteTemplate(RequestContext& request);
  void handleShowTemplate(RequestContext& request);
  void handleUpdateTemplate(RequestContext& request);

  void handleUpdateSettings(RequestContext& request);
  void handleGetSettings(RequestContext& request);

  void handleGetScreens(RequestContext& request);
  void handleResolveVariables(RequestContext& request);

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
