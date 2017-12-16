#include <EpaperWebServer.h>
#include <Update.h>

static const char INDEX_FILENAME[] = "/index.html";
static const char TEXT_HTML[] = "text/html";
static const char TEXT_PLAIN[] = "text/plain";
static const char APPLICATION_JSON[] = "application/json";

static const char CONTENT_TYPE_HEADER[] = "Content-Type";

EpaperWebServer::EpaperWebServer(DisplayTemplateDriver& driver, Settings& settings)
  : driver(driver),
    settings(settings),
    server(AsyncWebServer(settings.webPort))
{ }

EpaperWebServer::~EpaperWebServer() {
  server.reset();
}

void EpaperWebServer::begin() {
  on("/variables", HTTP_PUT, handleUpdateVariables());
  on("/variables", HTTP_GET, handleServeFile(VariableDictionary::FILENAME, APPLICATION_JSON));

  onUpload("/templates", HTTP_POST, handleCreateFile(TEMPLATES_DIRECTORY));
  onPattern("/templates/:filename", HTTP_DELETE, handleDeleteTemplate());
  onPattern("/templates/:filename", HTTP_GET, handleShowTemplate());
  onPattern("/templates/:filename", HTTP_PUT, handleUpdateTemplate());
  on("/templates", HTTP_GET, handleListDirectory(TEMPLATES_DIRECTORY));

  onUpload("/bitmaps", HTTP_POST, handleCreateFile(BITMAPS_DIRECTORY));
  onPattern("/bitmaps/:filename", HTTP_DELETE, handleDeleteBitmap());
  onPattern("/bitmaps/:filename", HTTP_GET, handleShowBitmap());
  on("/bitmaps", HTTP_GET, handleListDirectory(BITMAPS_DIRECTORY));

  on("/settings", HTTP_GET, handleListSettings());
  on("/settings", HTTP_PUT, handleUpdateSettings());

  on("/about", HTTP_GET, handleAbout());
  onUpload("/firmware", HTTP_POST, handleOtaSuccess(), handleOtaUpdate());

  on("/", HTTP_GET, handleServeFile(INDEX_FILENAME, TEXT_HTML));

  server.begin();
}

ArRequestHandlerFunction EpaperWebServer::handleOtaSuccess() {
  return [this](AsyncWebServerRequest* request) {
    request->send_P(200, PSTR(TEXT_PLAIN), PSTR("Update successful.  Device will now reboot.\n\n"));

    delay(1000);

    ESP.restart();
  };
}

ArUploadHandlerFunction EpaperWebServer::handleOtaUpdate() {
  return [this](
    AsyncWebServerRequest *request,
    const String& filename,
    size_t index,
    uint8_t *data,
    size_t len,
    bool isFinal
  ) {
    if (index == 0) {
      if (request->contentLength() > 0) {
        Update.begin(request->contentLength());
      } else {
        Serial.println(F("OTA Update: ERROR - Content-Length header required, but not present."));
      }
    }

    if (Update.size() > 0) {
      if (Update.write(data, len) != len) {
        Update.printError(Serial);
        Update.abort();
      }

      if (isFinal) {
        if (!Update.end(true)) {
          Update.printError(Serial);
          Update.abort();
        }
      }
    }
  };
}

ArRequestHandlerFunction EpaperWebServer::handleAbout() {
  return [this](AsyncWebServerRequest* request) {
    // Measure before allocating buffers
    uint32_t freeHeap = ESP.getFreeHeap();

    StaticJsonBuffer<150> buffer;
    JsonObject& res = buffer.createObject();

    res["version"] = QUOTE(EPAPER_TEMPLATES_VERSION);
    res["variant"] = QUOTE(FIRMWARE_VARIANT);
    res["free_heap"] = freeHeap;
    res["sdk_version"] = ESP.getSdkVersion();

    String body;
    res.printTo(body);

    request->send(200, APPLICATION_JSON, body);
  };
}

ArRequestHandlerFunction EpaperWebServer::sendSuccess() {
  return [this](AsyncWebServerRequest* request) {
    request->send(200, APPLICATION_JSON, "true");
  };
}

ArBodyHandlerFunction EpaperWebServer::handleUpdateVariables() {
  return [this](AsyncWebServerRequest* request, uint8_t* data, size_t len, size_t index, size_t total) {
    DynamicJsonBuffer buffer;
    JsonObject& vars = buffer.parseObject(data);

    if (! vars.success()) {
      request->send_P(400, TEXT_PLAIN, PSTR("Invalid JSON"));
      return;
    }

    for (JsonObject::iterator itr = vars.begin(); itr != vars.end(); ++itr) {
      driver.updateVariable(itr->key, itr->value);
    }

    request->send_P(200, APPLICATION_JSON, PSTR("true"));
  };
}

ArRequestHandlerFunction EpaperWebServer::handleServeFile(
  const char* filename,
  const char* contentType,
  const char* defaultText) {

  return [this, filename, contentType, defaultText](AsyncWebServerRequest* request) {
    if (!serveFile(request, filename, contentType)) {
      if (defaultText) {
        request->send(200, contentType, defaultText);
      } else {
        request->send(404);
      }
    }
  };
}

bool EpaperWebServer::serveFile(AsyncWebServerRequest* request, const char* file, const char* contentType) {
  if (SPIFFS.exists(file)) {
    request->send(SPIFFS, file, contentType);
    return true;
  }

  return false;
}

// ---------
// CRUD handlers for bitmaps
// ---------

PatternHandler::TPatternHandlerFn EpaperWebServer::handleShowBitmap() {
  return [this](const UrlTokenBindings* bindings, AsyncWebServerRequest* request) {
    if (bindings->hasBinding("filename")) {
      const char* filename = bindings->get("filename");
      String path = String(BITMAPS_DIRECTORY) + "/" + filename;

      request->send(SPIFFS, path, "application/octet-stream");
    } else {
      request->send_P(400, TEXT_PLAIN, PSTR("You must provide a filename"));
    }
  };
}

PatternHandler::TPatternHandlerFn EpaperWebServer::handleDeleteBitmap() {
  return [this](const UrlTokenBindings* bindings, AsyncWebServerRequest* request) {
    if (bindings->hasBinding("filename")) {
      const char* filename = bindings->get("filename");
      String path = String(BITMAPS_DIRECTORY) + "/" + filename;

      if (SPIFFS.exists(path)) {
        if (SPIFFS.remove(path)) {
          request->send_P(200, TEXT_PLAIN, PSTR("success"));
        } else {
          request->send_P(500, TEXT_PLAIN, PSTR("Failed to delete file"));
        }
      } else {
        request->send(404, TEXT_PLAIN);
      }
    } else {
      request->send_P(400, TEXT_PLAIN, PSTR("You must provide a filename"));
    }
  };
}

ArRequestHandlerFunction EpaperWebServer::handleListDirectory(const char* dirName) {
  return [this, dirName](AsyncWebServerRequest* request) {
    DynamicJsonBuffer buffer;
    JsonArray& responseObj = buffer.createArray();

#if defined(ESP8266)
    Dir dir = SPIFFS.openDir(dirName);

    while (dir.next()) {
      JsonObject& file = buffer.createObject();
      file["name"] = dir.fileName();
      file["size"] = dir.fileSize();
      responseObj.add(file);
    }
#elif defined(ESP32)
    File dir = SPIFFS.open(dirName);

    if (!dir || !dir.isDirectory()) {
      Serial.print(F("Path is not a directory - "));
      Serial.println(dirName);

      request->send_P(500, TEXT_PLAIN, PSTR("Expected path to be a directory, but wasn't"));
      return;
    }

    while (File dirFile = dir.openNextFile()) {
      JsonObject& file = buffer.createObject();

      file["name"] = String(dirFile.name());
      file["size"] = dirFile.size();

      responseObj.add(file);
    }
#endif

    String response;
    responseObj.printTo(response);

    request->send(200, APPLICATION_JSON, response);
  };
}

// ---------
// CRUD handlers for templates
// ---------

PatternHandler::TPatternHandlerFn EpaperWebServer::handleShowTemplate() {
  return [this](const UrlTokenBindings* bindings, AsyncWebServerRequest* request) {
    if (bindings->hasBinding("filename")) {
      const char* filename = bindings->get("filename");
      String path = String(TEMPLATES_DIRECTORY) + "/" + filename;
      request->send(SPIFFS, path, APPLICATION_JSON);
    } else {
      request->send_P(400, TEXT_PLAIN, PSTR("You must provide a filename"));
    }
  };
}

PatternHandler::TPatternHandlerBodyFn EpaperWebServer::handleUpdateTemplate() {
  return [this](
    const UrlTokenBindings* bindings,
    AsyncWebServerRequest* request,
    uint8_t* data,
    size_t len,
    size_t index,
    size_t total
  ) {
    if (bindings->hasBinding("filename")) {
      const char* filename = bindings->get("filename");
      String path = String(TEMPLATES_DIRECTORY) + "/" + filename;
      handleUpdateJsonFile(path, request, data, len);
    }
  };
}

PatternHandler::TPatternHandlerFn EpaperWebServer::handleDeleteTemplate() {
  return [this](const UrlTokenBindings* bindings, AsyncWebServerRequest* request) {
    if (bindings->hasBinding("filename")) {
      const char* filename = bindings->get("filename");
      String path = String(TEMPLATES_DIRECTORY) + "/" + filename;

      if (SPIFFS.exists(path)) {
        if (SPIFFS.remove(path)) {
          request->send_P(200, TEXT_PLAIN, PSTR("success"));
        } else {
          request->send_P(500, TEXT_PLAIN, PSTR("Failed to delete file"));
        }
      } else {
        request->send(404, TEXT_PLAIN);
      }
    } else {
      request->send_P(400, TEXT_PLAIN, PSTR("You must provide a filename"));
    }
  };
}

ArUploadHandlerFunction EpaperWebServer::handleCreateFile(const char* filePrefix) {
  return [this, filePrefix](
    AsyncWebServerRequest *request,
    const String& filename,
    size_t index,
    uint8_t *data,
    size_t len,
    bool isFinal
  ) {
    static File updateFile;

    if (index == 0) {
      String path = String(filePrefix) + "/" + filename;
      updateFile = SPIFFS.open(path, FILE_WRITE);

      if (!updateFile) {
        Serial.println(F("Failed to open file"));
        request->send(500);
        return;
      }
    }

    if (!updateFile || updateFile.write(data, len) != len) {
      Serial.println(F("Failed to write to file"));
      request->send(500);
    }

    if (updateFile && isFinal) {
      updateFile.close();
      request->send(200);
    }
  };
}

void EpaperWebServer::handleUpdateJsonFile(const String& path, AsyncWebServerRequest* request, uint8_t* data, size_t len) {
  DynamicJsonBuffer requestBuffer;
  JsonObject& body = requestBuffer.parseObject(data);

  if (! body.success()) {
    request->send_P(400, TEXT_PLAIN, PSTR("Invalid JSON"));
    return;
  }

  if (SPIFFS.exists(path)) {
    File file = SPIFFS.open(path, "r");

    DynamicJsonBuffer fileBuffer;
    JsonObject& tmpl = fileBuffer.parse(file);
    file.close();

    if (! tmpl.success()) {
      request->send_P(500, TEXT_PLAIN, PSTR("Failed to load persisted file"));
      return;
    }

    for (JsonObject::iterator itr = body.begin(); itr != body.end(); ++itr) {
      tmpl[itr->key] = itr->value;
    }

    file = SPIFFS.open(path, "w");
    tmpl.printTo(file);
    file.close();

    String response;
    tmpl.printTo(response);
    request->send(200, APPLICATION_JSON, response);
  } else {
    request->send(404, TEXT_PLAIN);
  }
}

ArBodyHandlerFunction EpaperWebServer::handleUpdateSettings() {
  return [this](
    AsyncWebServerRequest* request,
    uint8_t* data,
    size_t len,
    size_t index,
    size_t total
  ) {
    DynamicJsonBuffer buffer;
    JsonObject& req = buffer.parse(data);

    if (! req.success()) {
      request->send_P(400, TEXT_PLAIN, PSTR("Invalid JSON"));
      return;
    }

    settings.patch(req);
    settings.save();

    request->send(200);
  };
}

ArRequestHandlerFunction EpaperWebServer::handleListSettings() {
  return [this](AsyncWebServerRequest* request) {
    request->send(200, APPLICATION_JSON, settings.toJson());
  };
}

bool EpaperWebServer::isAuthenticated(AsyncWebServerRequest* request) {
  if (settings.hasAuthSettings()) {
    if (request->authenticate(settings.adminUsername.c_str(), settings.adminPassword.c_str())) {
      return true;
    } else {
      request->send_P(403, TEXT_PLAIN, PSTR("Authentication required"));
      return false;
    }
  } else {
    return true;
  }
}

void EpaperWebServer::onPattern(const String& pattern, const WebRequestMethod method, PatternHandler::TPatternHandlerFn fn) {
  PatternHandler::TPatternHandlerFn authedFn = [this, fn](const UrlTokenBindings* b, AsyncWebServerRequest* request) {
    if (isAuthenticated(request)) {
      fn(b, request);
    }
  };

  server.addHandler(new PatternHandler(pattern.c_str(), method, authedFn, NULL));
}

void EpaperWebServer::onPattern(const String& pattern, const WebRequestMethod method, PatternHandler::TPatternHandlerBodyFn fn) {
  PatternHandler::TPatternHandlerBodyFn authedFn = [this, fn](
    const UrlTokenBindings* bindings,
    AsyncWebServerRequest* request,
    uint8_t* data,
    size_t len,
    size_t index,
    size_t total
  ) {
    if (isAuthenticated(request)) {
      fn(bindings, request, data, len, index, total);
    }
  };

  server.addHandler(new PatternHandler(pattern.c_str(), method, NULL, authedFn));
}

void EpaperWebServer::on(const String& path, const WebRequestMethod method, ArRequestHandlerFunction fn) {
  ArRequestHandlerFunction authedFn = [this, fn](AsyncWebServerRequest* request) {
    if (isAuthenticated(request)) {
      fn(request);
    }
  };

  server.on(path.c_str(), method, authedFn);
}

void EpaperWebServer::on(const String& path, const WebRequestMethod method, ArBodyHandlerFunction fn) {
  ArBodyHandlerFunction authedFn = [this, fn](
    AsyncWebServerRequest* request,
    uint8_t* data,
    size_t len,
    size_t index,
    size_t total
  ) {
    if (isAuthenticated(request)) {
      fn(request, data, len, index, total);
    }
  };

  server.addHandler(new EpaperWebServer::BodyHandler(path.c_str(), method, authedFn));
}

void EpaperWebServer::onUpload(const String& path, const WebRequestMethod method, ArUploadHandlerFunction fn) {
  ArUploadHandlerFunction authedFn = [this, fn](
    AsyncWebServerRequest *request,
    const String& filename,
    size_t index,
    uint8_t *data,
    size_t len,
    bool isFinal
  ) {
    if (isAuthenticated(request)) {
      fn(request, filename, index, data, len, isFinal);
    }
  };

  server.addHandler(new EpaperWebServer::UploadHandler(path.c_str(), method, authedFn));
}

void EpaperWebServer::onUpload(const String& path, const WebRequestMethod method, ArRequestHandlerFunction onCompleteFn, ArUploadHandlerFunction fn) {
  ArUploadHandlerFunction authedFn = [this, fn](
    AsyncWebServerRequest *request,
    const String& filename,
    size_t index,
    uint8_t *data,
    size_t len,
    bool isFinal
  ) {
    if (isAuthenticated(request)) {
      fn(request, filename, index, data, len, isFinal);
    }
  };

  ArRequestHandlerFunction authedOnCompleteFn = [this, onCompleteFn](AsyncWebServerRequest* request) {
    if (isAuthenticated(request)) {
      onCompleteFn(request);
    }
  };

  server.addHandler(new EpaperWebServer::UploadHandler(path.c_str(), method, authedOnCompleteFn, authedFn));
}

EpaperWebServer::UploadHandler::UploadHandler(
  const char* uri,
  const WebRequestMethod method,
  ArRequestHandlerFunction onCompleteFn,
  ArUploadHandlerFunction handler
) : uri(new char[strlen(uri) + 1]),
    method(method),
    handler(handler),
    onCompleteFn(onCompleteFn)
{
  strcpy(this->uri, uri);
}

EpaperWebServer::UploadHandler::UploadHandler(
  const char* uri,
  const WebRequestMethod method,
  ArUploadHandlerFunction handler
) : UploadHandler(uri, method, NULL, handler)
{ }

EpaperWebServer::UploadHandler::~UploadHandler() {
  delete uri;
}

bool EpaperWebServer::UploadHandler::canHandle(AsyncWebServerRequest *request) {
  if (this->method != HTTP_ANY && this->method != request->method()) {
    return false;
  }

  return request->url() == this->uri;
}

void EpaperWebServer::UploadHandler::handleUpload(
  AsyncWebServerRequest *request,
  const String &filename,
  size_t index,
  uint8_t *data,
  size_t len,
  bool isFinal
) {
  handler(request, filename, index, data, len, isFinal);
}

void EpaperWebServer::UploadHandler::handleRequest(AsyncWebServerRequest* request) {
  if (onCompleteFn == NULL) {
    request->send(200);
  } else {
    onCompleteFn(request);
  }
}

EpaperWebServer::BodyHandler::BodyHandler(
  const char* uri,
  const WebRequestMethod method,
  ArBodyHandlerFunction handler
) : uri(new char[strlen(uri) + 1]),
    method(method),
    handler(handler)
{
  strcpy(this->uri, uri);
}

EpaperWebServer::BodyHandler::~BodyHandler() {
  delete uri;
}

bool EpaperWebServer::BodyHandler::canHandle(AsyncWebServerRequest *request) {
  if (this->method != HTTP_ANY && this->method != request->method()) {
    return false;
  }

  return request->url() == this->uri;
}

void EpaperWebServer::BodyHandler::handleRequest(AsyncWebServerRequest* request) {
  request->send(200);
}

void EpaperWebServer::BodyHandler::handleBody(
  AsyncWebServerRequest *request,
  uint8_t *data,
  size_t len,
  size_t index,
  size_t total
) {
  handler(request, data, len, index, total);
}
