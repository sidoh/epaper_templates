#include <ESPAsyncWebServer.h>
#include <FS.h>
#include <DisplayTemplateDriver.h>
#include <PatternHandler.h>
#include <Settings.h>

#if defined(ESP32)
#include <SPIFFS.h>
#endif

#ifndef _WEB_SERVER_H
#define _WEB_SERVER_H

class EpaperWebServer {
public:
  EpaperWebServer(DisplayTemplateDriver& driver, Settings& settings);
  ~EpaperWebServer();

  void begin();
  uint16_t getPort() const;

private:
  class BodyHandler : public AsyncWebHandler {
  public:
    BodyHandler(const char* uri, const WebRequestMethod method, ArBodyHandlerFunction handler);
    ~BodyHandler();

    virtual bool isRequestHandlerTrivial() override { return false; }
    virtual bool canHandle(AsyncWebServerRequest* request) override;
    virtual void handleRequest(AsyncWebServerRequest* request) override;
    virtual void handleBody(
      AsyncWebServerRequest *request,
      uint8_t *data,
      size_t len,
      size_t index,
      size_t total
    ) override;

  private:
    char* uri;
    const WebRequestMethod method;
    ArBodyHandlerFunction handler;
  };

  class UploadHandler : public AsyncWebHandler {
  public:
    UploadHandler(const char* uri, const WebRequestMethod method, ArUploadHandlerFunction handler);
    UploadHandler(const char* uri, const WebRequestMethod method, ArRequestHandlerFunction onCompleteFn, ArUploadHandlerFunction handler);
    ~UploadHandler();

    virtual bool isRequestHandlerTrivial() override { return false; }
    virtual bool canHandle(AsyncWebServerRequest* request) override;
    virtual void handleRequest(AsyncWebServerRequest* request) override;
    virtual void handleUpload(
      AsyncWebServerRequest *request,
      const String& filename,
      size_t index,
      uint8_t *data,
      size_t len,
      bool isFinal
    ) override;

  private:
    char* uri;
    const WebRequestMethod method;
    ArUploadHandlerFunction handler;
    ArRequestHandlerFunction onCompleteFn;
  };

  AsyncWebServer server;
  DisplayTemplateDriver& driver;
  Settings& settings;
  uint16_t port;

  ArBodyHandlerFunction handleUpdateVariables();
  ArRequestHandlerFunction sendSuccess();

  // Special routes
  ArRequestHandlerFunction handleAbout();
  ArUploadHandlerFunction  handleOtaUpdate();
  ArRequestHandlerFunction handleOtaSuccess();

  // General helpers
  ArRequestHandlerFunction handleListDirectory(const char* dir);
  ArUploadHandlerFunction  handleCreateFile(const char* filePrefix);

  // CRUD handlers for Bitmaps
  PatternHandler::TPatternHandlerFn handleDeleteBitmap();
  PatternHandler::TPatternHandlerFn handleShowBitmap();

  // CRUD handlers for Templates
  PatternHandler::TPatternHandlerFn     handleDeleteTemplate();
  PatternHandler::TPatternHandlerFn     handleShowTemplate();
  PatternHandler::TPatternHandlerBodyFn handleUpdateTemplate();

  ArBodyHandlerFunction    handleUpdateSettings();
  ArRequestHandlerFunction handleListSettings();

  ArUploadHandlerFunction handleUpdateFile(const char* filename);
  ArRequestHandlerFunction handleServeFile(
    const char* filename,
    const char* contentType,
    const char* defaultText = ""
  );
  bool serveFile(AsyncWebServerRequest* request, const char* file, const char* contentType);
  void handleUpdateJsonFile(const String& file, AsyncWebServerRequest* request, uint8_t* data, size_t len);

  // Checks if auth is enabled, and requires appropriate username/password if so
  bool isAuthenticated(AsyncWebServerRequest* request);

  // Support for routes with tokens like a/:id/:id2. Injects auth handling.
  void onPattern(const String& pattern, const WebRequestMethod method, PatternHandler::TPatternHandlerFn fn);
  void onPattern(const String& pattern, const WebRequestMethod method, PatternHandler::TPatternHandlerBodyFn fn);

  // Injects auth handling
  void on(const String& pattern, const WebRequestMethod method, ArRequestHandlerFunction fn);
  void on(const String& pattern, const WebRequestMethod method, ArBodyHandlerFunction fn);
  void onUpload(const String& pattern, const WebRequestMethod method, ArUploadHandlerFunction uploadFn);
  void onUpload(const String& pattern, const WebRequestMethod method, ArRequestHandlerFunction onCompleteFn, ArUploadHandlerFunction uploadFn);
};

#endif
