#include <Arduino.h>
#include <functional>

#include <ESPAsyncWebServer.h>

#include <TokenIterator.h>
#include <UrlTokenBindings.h>

#ifndef _PATTERNHANDLER_H
#define _PATTERNHANDLER_H

class PatternHandler : public AsyncWebHandler {
public:
  typedef std::function<void(const UrlTokenBindings*, AsyncWebServerRequest* request)> TPatternHandlerFn;
  typedef std::function<void(
    const UrlTokenBindings*,
    AsyncWebServerRequest*,
    uint8_t* data,
    size_t len,
    size_t index,
    size_t total
  )> TPatternHandlerBodyFn;

  PatternHandler(const char* pattern,
    const WebRequestMethod method,
    TPatternHandlerFn fn = NULL,
    TPatternHandlerBodyFn bodyFn = NULL);

  ~PatternHandler();

  virtual bool isRequestHandlerTrivial() { return false; }

  virtual bool canHandle(AsyncWebServerRequest* request);
  virtual void handleRequest(AsyncWebServerRequest *request);
  virtual void handleBody(AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total);

private:
  char* _pattern;
  TokenIterator* patternTokens;
  const WebRequestMethod method;
  PatternHandler::TPatternHandlerFn _fn;
  PatternHandler::TPatternHandlerBodyFn _bodyFn;
};

#endif
