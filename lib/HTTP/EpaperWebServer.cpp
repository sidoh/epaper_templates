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
    authProvider(settings),
    server(RichHttpServer<RichHttpConfig>(settings.webPort, authProvider)),
    port(settings.webPort)
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
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleServeGzip_P, this, TEXT_HTML, index_html_gz, index_html_gz_len, _1));

  server
    .buildHandler("/variables")
    .on(HTTP_PUT, std::bind(&EpaperWebServer::handleUpdateVariables, this, _1))
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleServeFile, this, VariableDictionary::FILENAME, APPLICATION_JSON, "", _1));

  server
    .buildHandler("/templates")
    .on(
      HTTP_POST,
      std::bind(&EpaperWebServer::handleNoOp, this),
      std::bind(&EpaperWebServer::handleCreateFile, this, TEMPLATES_DIRECTORY, _1)
    )
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleListDirectory, this, TEMPLATES_DIRECTORY, _1));

  server
    .buildHandler("/templates/:filename")
    .on(HTTP_DELETE, std::bind(&EpaperWebServer::handleDeleteTemplate, this, _1))
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleShowTemplate, this, _1))
    .on(HTTP_PUT, std::bind(&EpaperWebServer::handleUpdateTemplate, this, _1));

  server
    .buildHandler("/bitmaps")
    .on(
      HTTP_POST,
      std::bind(&EpaperWebServer::handleNoOp, this),
      std::bind(&EpaperWebServer::handleCreateFile, this, BITMAPS_DIRECTORY, _1)
    )
    .on(
      HTTP_GET,
      std::bind(&EpaperWebServer::handleListDirectory, this, BITMAPS_DIRECTORY, _1)
    );
  server
    .buildHandler("/bitmaps/:filename")
    .on(HTTP_DELETE, std::bind(&EpaperWebServer::handleDeleteBitmap, this, _1))
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleShowBitmap, this, _1));

  server
    .buildHandler("/settings")
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleServeFile, this, SETTINGS_FILE, APPLICATION_JSON, "", _1))
    .on(HTTP_PUT, std::bind(&EpaperWebServer::handleUpdateSettings, this, _1));

  server
    .buildHandler("/about")
    .on(HTTP_GET, std::bind(&EpaperWebServer::handleAbout, this, _1));

  server
    .buildHandler("/firmware")
    .handleOTA();

  server.onNotFound([this](AsyncWebServerRequest *request) {
    if (request->url().startsWith("/app/")) {
      _handleServeGzip_P(TEXT_HTML, index_html_gz, index_html_gz_len, request);
    } else {
      request->send(404);
    }
  });

  server.clearBuilders();
  server.begin();
}

void EpaperWebServer::handleNoOp() { }

void EpaperWebServer::handleAbout(RequestContext& request) {
  // Measure before allocating buffers
  uint32_t freeHeap = ESP.getFreeHeap();

  request.response.json["version"] = QUOTE(EPAPER_TEMPLATES_VERSION);
  request.response.json["variant"] = QUOTE(FIRMWARE_VARIANT);
  request.response.json["free_heap"] = freeHeap;
  request.response.json["sdk_version"] = ESP.getSdkVersion();
}

void EpaperWebServer::handleUpdateVariables(RequestContext& request) {
  JsonObject vars = request.getJsonBody().as<JsonObject>();

  if (vars.isNull()) {
    request.response.setCode(400);
    request.response.json["error"] = F("Invalid JSON");
    return;
  }

  for (JsonObject::iterator itr = vars.begin(); itr != vars.end(); ++itr) {
    driver->updateVariable(itr->key().c_str(), itr->value().as<String>());
  }

  request.response.json["success"] = true;
}

void EpaperWebServer::handleServeGzip_P(
  const char* contentType,
  const uint8_t* text,
  size_t length,
  RequestContext& request
) {
  _handleServeGzip_P(contentType, text, length, request.rawRequest);
}

void EpaperWebServer::_handleServeGzip_P(
  const char* contentType,
  const uint8_t* text,
  size_t length,
  AsyncWebServerRequest* request
) {
  AsyncWebServerResponse* response = request->beginResponse_P(200, contentType, text, length);
  response->addHeader("Content-Encoding", "gzip");
  request->send(response);
}

void EpaperWebServer::handleServeFile(
  const char* filename,
  const char* contentType,
  const char* defaultText,
  RequestContext& request
) {
  if (! serveFile(filename, contentType, request)) {
    if (defaultText) {
      request.response.sendRaw(200, contentType, defaultText);
    } else {
      request.response.setCode(404);
      request.response.json["error"] = F("Not found");
    }
  }
}

bool EpaperWebServer::serveFile(const char* file, const char* contentType, RequestContext& request) {
  if (SPIFFS.exists(file)) {
    request.rawRequest->send(SPIFFS, file, contentType);
    return true;
  }

  return false;
}

// ---------
// CRUD handlers for bitmaps
// ---------

void EpaperWebServer::handleShowBitmap(RequestContext& request) {
  const char* filename = request.pathVariables.get("filename");
  String path = String(BITMAPS_DIRECTORY) + "/" + filename;
  request.rawRequest->send(SPIFFS, path, "application/octet-stream");
}

void EpaperWebServer::handleDeleteBitmap(RequestContext& request) {
  const char* filename = request.pathVariables.get("filename");
  String path = String(BITMAPS_DIRECTORY) + "/" + filename;
  handleDeleteFile(filename, request);
}

void EpaperWebServer::handleListDirectory(const char* dirName, RequestContext& request) {
  JsonArray responseObj = request.response.json.to<JsonArray>();

#if defined(ESP8266)
  Dir dir = SPIFFS.openDir(dirName);

  while (dir.next()) {
    JsonObject file = responseObj.createNestedObject();
    file["name"] = dir.fileName();
    file["size"] = dir.fileSize();
  }
#elif defined(ESP32)
  File dir = SPIFFS.open(dirName);

  if (!dir || !dir.isDirectory()) {
    Serial.print(F("Path is not a directory - "));
    Serial.println(dirName);

    request.response.setCode(500);
    request.response.json["error"] = F("Expected path to be a directory, but wasn't");
    return;
  }

  while (File dirFile = dir.openNextFile()) {
    JsonObject file = responseObj.createNestedObject();

    file["name"] = String(dirFile.name());
    file["size"] = dirFile.size();
  }
#endif
}

// ---------
// CRUD handlers for templates
// ---------

void EpaperWebServer::handleShowTemplate(RequestContext& request) {
  const char* filename = request.pathVariables.get("filename");
  String path = String(TEMPLATES_DIRECTORY) + "/" + filename;

  if (SPIFFS.exists(path.c_str())) {
    request.rawRequest->send(SPIFFS, path, APPLICATION_JSON);
  } else {
    request.response.json["error"] = F("File not found");
    request.response.setCode(404);
  }
}

void EpaperWebServer::handleDeleteFile(const String& path, RequestContext& request) {
  if (SPIFFS.exists(path)) {
    if (SPIFFS.remove(path)) {
      request.response.json["success"] = true;
    } else {
      request.response.setCode(500);
      request.response.json["error"] = F("Failed to delete file");
    }
  } else {
    request.response.setCode(404);
    request.response.json["error"] = F("File not found");
  }
}

void EpaperWebServer::handleUpdateTemplate(RequestContext& request) {
  const char* filename = request.pathVariables.get("filename");
  String path = String(TEMPLATES_DIRECTORY) + "/" + filename;
  handleUpdateJsonFile(path, request);
}

void EpaperWebServer::handleDeleteTemplate(RequestContext& request) {
  const char* filename = request.pathVariables.get("filename");
  String path = String(TEMPLATES_DIRECTORY) + "/" + filename;
  handleDeleteFile(path, request);
}

void EpaperWebServer::handleCreateFile(const char* filePrefix, RequestContext& request) {
  static File updateFile;

  if (request.upload.index == 0) {
    String path = String(filePrefix) + "/" + request.upload.filename;
    updateFile = SPIFFS.open(path, FILE_WRITE);

    if (!updateFile) {
      request.response.setCode(500);
      request.response.json["error"] = F("Failed to open file");
      return;
    }
  }

  if (!updateFile || updateFile.write(request.upload.data, request.upload.length) != request.upload.length) {
    request.response.setCode(500);
    request.response.json["error"] = F("Failed to write to file");
  }

  if (updateFile && request.upload.isFinal) {
    updateFile.close();
    request.response.json["success"] = true;
  }
}

void EpaperWebServer::handleUpdateJsonFile(const String& path, RequestContext& request) {
  JsonObject body = request.getJsonBody().as<JsonObject>();

  if (body.isNull()) {
    request.response.json["error"] = F("Invalid JSON");
    request.response.setCode(400);
    return;
  }

  if (SPIFFS.exists(path)) {
    File file = SPIFFS.open(path, "r");

    DynamicJsonDocument fileBuffer(4096);
    deserializeJson(fileBuffer, file);
    file.close();
    JsonObject tmpl = fileBuffer.as<JsonObject>();

    if (tmpl.isNull()) {
      request.response.json["error"] = F("Failed to load persisted file");
      request.response.setCode(500);
      return;
    }

    for (JsonObject::iterator itr = body.begin(); itr != body.end(); ++itr) {
      tmpl[itr->key()] = itr->value();
    }

    file = SPIFFS.open(path, "w");
    serializeJson(tmpl, file);
    file.close();

    for (JsonObject::iterator itr = tmpl.begin(); itr != tmpl.end(); ++itr) {
      request.response.json[itr->key()] = itr->value();
    }
  } else {
    request.response.setCode(404);
  }
}

void EpaperWebServer::handleUpdateSettings(RequestContext& request) {
  JsonObject req = request.getJsonBody().as<JsonObject>();

  if (req.isNull()) {
    request.response.json["error"] = F("Invalid JSON");
    request.response.setCode(400);
    return;
  }

  settings.patch(req);
  settings.save();

  request.response.json["success"] = true;
}