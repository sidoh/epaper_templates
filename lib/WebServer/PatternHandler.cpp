#include <PatternHandler.h>
#include <ArduinoJson.h>

PatternHandler::PatternHandler(
    const char* pattern,
    const WebRequestMethod method,
    PatternHandler::TPatternHandlerFn fn,
    PatternHandler::TPatternHandlerBodyFn bodyFn
) : method(method),
    _pattern(new char[strlen(pattern) + 1]),
    patternTokens(NULL)
{
  strcpy(_pattern, pattern);
  patternTokens = new TokenIterator(_pattern, strlen(pattern), '/');
  this->_fn = fn;
  this->_bodyFn = bodyFn;
}

PatternHandler::~PatternHandler() {
  delete _pattern;
  delete patternTokens;
}

bool PatternHandler::canHandle(AsyncWebServerRequest* request) {
  if (this->method != HTTP_ANY && request->method() != this->method) {
    return false;
  }

  bool canHandle = true;
  const String& requestUri = request->url();
  char requestUriCopy[requestUri.length() + 1];
  strcpy(requestUriCopy, requestUri.c_str());
  TokenIterator requestTokens(requestUriCopy, requestUri.length(), '/');

  patternTokens->reset();
  while (patternTokens->hasNext() && requestTokens.hasNext()) {
    const char* patternToken = patternTokens->nextToken();
    const char* requestToken = requestTokens.nextToken();

    if (patternToken[0] != ':' && strcmp(patternToken, requestToken) != 0) {
      canHandle = false;
      break;
    }

    if (patternTokens->hasNext() != requestTokens.hasNext()) {
      canHandle = false;
      break;
    }
  }

  return canHandle;
}

void PatternHandler::handleRequest(AsyncWebServerRequest *request) {
  if (_fn) {
    const String& requestUri = request->url();
    char requestUriCopy[requestUri.length()];
    strcpy(requestUriCopy, requestUri.c_str());
    TokenIterator requestTokens(requestUriCopy, requestUri.length(), '/');
    UrlTokenBindings bindings(*patternTokens, requestTokens);
    _fn(&bindings, request);
  }
}

void PatternHandler::handleBody(AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
  if (_bodyFn) {
    const String& requestUri = request->url();
    char requestUriCopy[requestUri.length()];
    strcpy(requestUriCopy, requestUri.c_str());
    TokenIterator requestTokens(requestUriCopy, requestUri.length(), '/');
    UrlTokenBindings bindings(*patternTokens, requestTokens);
    _bodyFn(&bindings, request, data, len, index, total);
  }
}
