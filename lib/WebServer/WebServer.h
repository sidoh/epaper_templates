#include <FS.h>
#include <ESP8266WebServer.h>
#include <DisplayTemplateDriver.h>
#include <PatternHandler.h>
#include <Settings.h>

#ifndef _WEB_SERVER_H
#define _WEB_SERVER_H

class WebServer {
public:
  WebServer(DisplayTemplateDriver& driver, Settings& settings);

  void begin();
  void loop();

private:
  ESP8266WebServer server;
  File updateFile;
  DisplayTemplateDriver& driver;
  Settings& settings;

  void handleUpdateVariables();
  ESP8266WebServer::THandlerFunction sendSuccess();

  ESP8266WebServer::THandlerFunction handleAbout();

  // CRUD handlers for Bitmaps
  ESP8266WebServer::THandlerFunction handleListBitmaps();
  ESP8266WebServer::THandlerFunction handleCreateBitmap();
  PatternHandler::TPatternHandlerFn  handleDeleteBitmap();
  PatternHandler::TPatternHandlerFn  handleShowBitmap();

  // CRUD handlers for Templates
  ESP8266WebServer::THandlerFunction handleListTemplates();
  ESP8266WebServer::THandlerFunction handleCreateTemplate();
  PatternHandler::TPatternHandlerFn  handleDeleteTemplate();
  PatternHandler::TPatternHandlerFn  handleShowTemplate();
  PatternHandler::TPatternHandlerFn  handleUpdateTemplate();

  ESP8266WebServer::THandlerFunction handleUpdateSettings();
  ESP8266WebServer::THandlerFunction handleListSettings();

  ESP8266WebServer::THandlerFunction handleUpdateFile(const char* filename);
  ESP8266WebServer::THandlerFunction handleServeFile(
    const char* filename,
    const char* contentType,
    const char* defaultText = ""
  );
  bool serveFile(const char* file, const char* contentType);
  void handleUpdateJsonFile(const String& file);

  // Checks if auth is enabled, and requires appropriate username/password if so
  bool isAuthenticated();

  // Support for routes with tokens like a/:id/:id2. Injects auth handling.
  void onPattern(const String& pattern, const HTTPMethod method, PatternHandler::TPatternHandlerFn fn);

  // Injects auth handling
  void on(const String& pattern, const HTTPMethod method, ESP8266WebServer::THandlerFunction fn);
  void on(const String& pattern, const HTTPMethod method, ESP8266WebServer::THandlerFunction fn, ESP8266WebServer::THandlerFunction uploadFn);
};

#endif
