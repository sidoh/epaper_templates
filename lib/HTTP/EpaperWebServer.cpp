#include <EpaperWebServer.h>
#include <index.html.gz.h>

#if defined(ESP8266)
#include <Updater.h>
#elif defined(ESP32)
#include <Update.h>
#endif

static const char INDEX_FILENAME[] = "/index.html";
static const char TEXT_HTML[] = "text/html";
static const char TEXT_PLAIN[] = "text/plain";
static const char APPLICATION_JSON[] = "application/json";

static const char CONTENT_TYPE_HEADER[] = "Content-Type";

using namespace std::placeholders;

EpaperWebServer::EpaperWebServer(DisplayTemplateDriver*& driver, Settings& settings)
  : driver(driver),
    settings(settings),
    port(settings.webPort),
    server(RichHttpServer(settings.webPort))
{ }

EpaperWebServer::~EpaperWebServer() {
  server.reset();
}

uint16_t EpaperWebServer::getPort() const {
  return port;
}

void EpaperWebServer::begin() {
  server
    .buildHandler("/")
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleServeGzip_P, this, _1, TEXT_HTML, index_html_gz, index_html_gz_len));
  // on("/", HTTP_GET, handleServeGzip_P(TEXT_HTML, index_html_gz, index_html_gz_len));

  server
    .buildHandler("/variables")
    .on(
      HTTP_PUT,
      std::bind(&EpaperWebServer::handleStaticResponse_P, this, _1, 200, APPLICATION_JSON, PSTR("true")),
      std::bind(&EpaperWebServer::handleUpdateVariables, this, _1, _2, _3, _4, _5)
    )
    .on(
      HTTP_GET,
      std::bind(&EpaperWebServer::handleServeFile, this, _1, VariableDictionary::FILENAME, APPLICATION_JSON, "")
    );
  // on("/variables", HTTP_PUT, handleUpdateVariables());
  // on("/variables", HTTP_GET, handleServeFile(VariableDictionary::FILENAME, APPLICATION_JSON));

  server
    .buildHandler("/templates")
    .on(
      HTTP_POST,
      std::bind(&EpaperWebServer::handleNoOp, this, _1),
      std::bind(&EpaperWebServer::handleCreateFile, this, TEMPLATES_DIRECTORY, _1, _2, _3, _4, _5, _6)
    )
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleListDirectory, this, TEMPLATES_DIRECTORY, _1));

  // onUpload("/templates", HTTP_POST, handleCreateFile(TEMPLATES_DIRECTORY));
  // on("/templates", HTTP_GET, handleListDirectory(TEMPLATES_DIRECTORY));

  server
    .buildHandler("/templates/:filename")
    .on(HTTP_DELETE, std::bind(&EpaperWebServer::handleDeleteTemplate, this, _1, _2))
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleShowTemplate, this, _1, _2))
    .on(
      HTTP_PUT,
      std::bind(&EpaperWebServer::handleNoOp, this, _1),
      std::bind(&EpaperWebServer::handleUpdateTemplate, this, _1, _2, _3, _4, _5, _6)
    );
  // onPattern("/templates/:filename", HTTP_DELETE, handleDeleteTemplate());
  // onPattern("/templates/:filename", HTTP_GET, handleShowTemplate());
  // onPattern("/templates/:filename", HTTP_PUT, handleUpdateTemplate());

  server
    .buildHandler("/bitmaps")
    .on(
      HTTP_POST,
      std::bind(&EpaperWebServer::handleNoOp, this, _1),
      std::bind(&EpaperWebServer::handleCreateFile, this, BITMAPS_DIRECTORY, _1, _2, _3, _4, _5, _6)
    )
    .on(
      HTTP_GET,
      std::bind(&EpaperWebServer::handleListDirectory, this, BITMAPS_DIRECTORY, _1)
    );
  server
    .buildHandler("/bitmaps/:filename")
    .on(HTTP_DELETE, std::bind(&EpaperWebServer::handleDeleteBitmap, this, _1, _2))
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleShowBitmap, this, _1, _2));
  // onUpload("/bitmaps", HTTP_POST, handleCreateFile(BITMAPS_DIRECTORY));
  // onPattern("/bitmaps/:filename", HTTP_DELETE, handleDeleteBitmap());
  // onPattern("/bitmaps/:filename", HTTP_GET, handleShowBitmap());
  // on("/bitmaps", HTTP_GET, handleListDirectory(BITMAPS_DIRECTORY));

  server
    .buildHandler("/settings")
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleListSettings, this, _1))
    .on(
      HTTP_PUT,
      std::bind(&EpaperWebServer::handleNoOp, this, _1),
      std::bind(&EpaperWebServer::handleUpdateSettings, this, _1, _2, _3, _4, _5)
    );
  // on("/settings", HTTP_GET, handleListSettings());
  // on("/settings", HTTP_PUT, handleUpdateSettings());

  server
    .buildHandler("/about")
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleAbout, this, _1));

  server
    .buildHandler("/firmware")
    .on(
      HTTP_POST,
      std::bind(&EpaperWebServer::handleOtaSuccess, this, _1),
      std::bind(&EpaperWebServer::handleOtaUpdate, this, _1, _2, _3, _4, _5, _6)
    );
  // onUpload("/firmware", HTTP_POST, handleOtaSuccess(), handleOtaUpdate());

  // server.onNotFound(wrapAuth([this](AsyncWebServerRequest *request) {
  //   if (request->url().startsWith("/app/")) {
  //     handleServeGzip_P(TEXT_HTML, index_html_gz, index_html_gz_len)(request);
  //   } else {
  //     request->send(404);
  //   }
  // }));

  server.begin();
}

void EpaperWebServer::handleStaticResponse_P(AsyncWebServerRequest* request, int responseCode, const char* responseType, const char* message) {
  request->send_P(responseCode, responseType, message);
}

void EpaperWebServer::handleNoOp(AsyncWebServerRequest* request) {
}

void EpaperWebServer::handleOtaSuccess(AsyncWebServerRequest* request) {
  request->send_P(200, TEXT_PLAIN, PSTR("Update successful.  Device will now reboot.\n\n"));

  delay(1000);

  ESP.restart();
}

void EpaperWebServer::handleOtaUpdate(
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

#if defined(ESP32)
      Update.abort();
#endif
    }

    if (isFinal) {
      if (!Update.end(true)) {
        Update.printError(Serial);
#if defined(ESP32)
        Update.abort();
#endif
      }
    }
  }
}

void EpaperWebServer::handleAbout(AsyncWebServerRequest* request) {
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
}

void EpaperWebServer::handleUpdateVariables(
  AsyncWebServerRequest* request,
  uint8_t* data,
  size_t len,
  size_t index,
  size_t total
) {
  DynamicJsonBuffer buffer;
  JsonObject& vars = buffer.parseObject(data);

  if (! vars.success()) {
    request->send_P(400, TEXT_PLAIN, PSTR("Invalid JSON"));
    return;
  }

  for (JsonObject::iterator itr = vars.begin(); itr != vars.end(); ++itr) {
    driver->updateVariable(itr->key, itr->value);
  }

  request->send_P(200, APPLICATION_JSON, PSTR("true"));
}

void EpaperWebServer::handleServeGzip_P(
  AsyncWebServerRequest* request,
  const char* contentType,
  const uint8_t* text,
  size_t length
) {
  AsyncWebServerResponse* response = request->beginResponse_P(200, contentType, text, length);
  response->addHeader("Content-Encoding", "gzip");
  request->send(response);
}

void EpaperWebServer::handleServeFile(
  AsyncWebServerRequest* request,
  const char* filename,
  const char* contentType,
  const char* defaultText
) {
  if (!serveFile(request, filename, contentType)) {
    if (defaultText) {
      request->send(200, contentType, defaultText);
    } else {
      request->send(404);
    }
  }
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

void EpaperWebServer::handleShowBitmap(AsyncWebServerRequest* request, const UrlTokenBindings* bindings) {
  if (bindings->hasBinding("filename")) {
    const char* filename = bindings->get("filename");
    String path = String(BITMAPS_DIRECTORY) + "/" + filename;

    request->send(SPIFFS, path, "application/octet-stream");
  } else {
    request->send_P(400, TEXT_PLAIN, PSTR("You must provide a filename"));
  }
}

void EpaperWebServer::handleDeleteBitmap(AsyncWebServerRequest* request, const UrlTokenBindings* bindings) {
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
}

void EpaperWebServer::handleListDirectory(const char* dirName, AsyncWebServerRequest* request) {
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
}

// ---------
// CRUD handlers for templates
// ---------

void EpaperWebServer::handleShowTemplate(AsyncWebServerRequest* request, const UrlTokenBindings* bindings) {
  if (bindings->hasBinding("filename")) {
    const char* filename = bindings->get("filename");
    String path = String(TEMPLATES_DIRECTORY) + "/" + filename;

    if (SPIFFS.exists(path.c_str())) {
      request->send(SPIFFS, path, APPLICATION_JSON);
    } else {
      request->send_P(404, TEXT_PLAIN, PSTR("File not found."));
    }
  } else {
    request->send_P(400, TEXT_PLAIN, PSTR("You must provide a filename"));
  }
}

void EpaperWebServer::handleUpdateTemplate(
  AsyncWebServerRequest* request,
  uint8_t* data,
  size_t len,
  size_t index,
  size_t total,
  const UrlTokenBindings* bindings
) {
  if (bindings->hasBinding("filename")) {
    const char* filename = bindings->get("filename");
    String path = String(TEMPLATES_DIRECTORY) + "/" + filename;
    handleUpdateJsonFile(path, request, data, len);
  }
}

void EpaperWebServer::handleDeleteTemplate(AsyncWebServerRequest* request, const UrlTokenBindings* bindings) {
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
}

void EpaperWebServer::handleCreateFile(
  const char* filePrefix,
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
    Serial.println("Writing to file: ");
    Serial.println(path);

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

void EpaperWebServer::handleUpdateSettings(
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
}

void EpaperWebServer::handleListSettings(AsyncWebServerRequest* request) {
  request->send(200, APPLICATION_JSON, settings.toJson());
}