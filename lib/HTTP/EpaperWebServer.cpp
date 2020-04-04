#include <DisplayTypeHelpers.h>
#include <EpaperWebServer.h>
#include <web_assets.h>

#if defined(ESP8266)
#include <Updater.h>
#elif defined(ESP32)
#include <Update.h>
#endif

static const char TEXT_HTML[] = "text/html";
static const char TEXT_PLAIN[] = "text/plain";
static const char APPLICATION_JSON[] = "application/json";

static const char CONTENT_TYPE_HEADER[] = "Content-Type";
static const char METADATA_FILENAME[] = "metadata.json";
static const char TMP_DIRECTORY[] = "/x";

using namespace std::placeholders;

EpaperWebServer::EpaperWebServer(
    DisplayTemplateDriver*& driver, Settings& settings)
    : driver(driver)
    , settings(settings)
    , authProvider(settings.web)
    , server(RichHttpServer<RichHttpConfig>(
          settings.web.port == 0 ? 80 : settings.web.port, authProvider))
    , port(settings.web.port)
    , changeFn(nullptr)
    , cancelSleepFn(nullptr)
    , wsServer("/socket")
    , deepSleepActive(false)
    , updateSuccessful(false) {
  driver->onVariableUpdate(
      std::bind(&EpaperWebServer::handleVariableUpdate, this, _1, _2));
  driver->onRegionUpdate(
      std::bind(&EpaperWebServer::handleRegionUpdate, this, _1, _2, _3));
}

EpaperWebServer::~EpaperWebServer() { server.reset(); }

void EpaperWebServer::setDeepSleepActive(bool deepSleepActive) {
  this->deepSleepActive = deepSleepActive;
}

uint16_t EpaperWebServer::getPort() const { return port; }

void EpaperWebServer::handleClient() { wsServer.cleanupClients(); }

void EpaperWebServer::begin() {
  for (auto it = WEB_ASSET_CONTENTS.begin(); it != WEB_ASSET_CONTENTS.end();
       ++it) {
    const char* filename = it->first;
    const uint8_t* contents = it->second;
    const size_t length = WEB_ASSET_LENGTHS.at(filename);
    const char* contentType = WEB_ASSET_CONTENT_TYPES.at(filename);

    server.buildHandler(filename).on(HTTP_GET,
        std::bind(&EpaperWebServer::handleServeGzip_P,
            this,
            contentType,
            contents,
            length,
            _1));
  }

  server.buildHandler("/api/v1/variables")
      .on(HTTP_PUT,
          std::bind(&EpaperWebServer::handleUpdateVariables, this, _1))
      .on(HTTP_GET,
          std::bind(&EpaperWebServer::handleServeFile,
              this,
              VariableDictionary::FILENAME,
              APPLICATION_JSON,
              "",
              _1));

  server.buildHandler("/api/v1/variables/:variable_name")
      .on(HTTP_DELETE,
          std::bind(&EpaperWebServer::handleDeleteVariable, this, _1));

  server.buildHandler("/api/v1/formatted_variables")
      .on(HTTP_POST,
          std::bind(&EpaperWebServer::handleGetFormattedVariables, this, _1));

  server.buildHandler("/api/v1/templates")
      .on(HTTP_POST,
          std::bind(&EpaperWebServer::handleNoOp, this, _1),
          std::bind(&EpaperWebServer::handleCreateFile,
              this,
              TEMPLATES_DIRECTORY,
              _1))
      .on(HTTP_GET,
          std::bind(&EpaperWebServer::handleListDirectory,
              this,
              TEMPLATES_DIRECTORY,
              _1));

  server.buildHandler("/api/v1/templates/:filename")
      .on(HTTP_DELETE,
          std::bind(&EpaperWebServer::handleDeleteTemplate, this, _1))
      .on(HTTP_GET, std::bind(&EpaperWebServer::handleShowTemplate, this, _1))
      .on(HTTP_PUT,
          std::bind(&EpaperWebServer::handleUpdateTemplate, this, _1));

  server.buildHandler("/api/v1/bitmaps")
      .on(HTTP_POST,
          std::bind(&EpaperWebServer::handleCreateBitmapFinish, this, _1),
          std::bind(&EpaperWebServer::handleCreateBitmap, this, _1))
      .on(HTTP_GET, std::bind(&EpaperWebServer::handleListBitmaps, this, _1));

  server.buildHandler("/api/v1/bitmaps/:filename")
      .on(HTTP_DELETE,
          std::bind(&EpaperWebServer::handleDeleteBitmap, this, _1))
      .on(HTTP_GET, std::bind(&EpaperWebServer::handleShowBitmap, this, _1));

  server.buildHandler("/api/v1/settings")
      .on(HTTP_GET, std::bind(&EpaperWebServer::handleGetSettings, this, _1))
      .on(HTTP_PUT,
          std::bind(&EpaperWebServer::handleUpdateSettings, this, _1));

  server.buildHandler("/api/v1/system")
      .on(HTTP_GET, std::bind(&EpaperWebServer::handleGetSystem, this, _1))
      .on(HTTP_POST, std::bind(&EpaperWebServer::handlePostSystem, this, _1));

  server.buildHandler("/api/v1/screens")
      .on(HTTP_GET, std::bind(&EpaperWebServer::handleGetScreens, this, _1));

  server.buildHandler("/api/v1/resolve_variables")
      .on(HTTP_GET,
          std::bind(&EpaperWebServer::handleResolveVariables, this, _1));

  server.buildHandler("/firmware")
      .on(HTTP_POST,
          std::bind(&EpaperWebServer::handleFirmwareUpdateComplete, this, _1),
          std::bind(&EpaperWebServer::handleFirmwareUpdateUpload, this, _1));

  server.onNotFound([this](AsyncWebServerRequest* request) {
    if (request->url() == "/" || request->url().startsWith("/app")) {
      _handleServeGzip_P(TEXT_HTML,
          INDEX_HTML_GZ,
          INDEX_HTML_GZ_LENGTH,
          request);
    } else {
      request->send(404);
    }
  });

  wsServer.onEvent([this](AsyncWebSocket* server,
                       AsyncWebSocketClient* client,
                       AwsEventType type,
                       void* arg,
                       uint8_t* data,
                       size_t len) {
    if (type == WS_EVT_DATA) {
      AwsFrameInfo* info = (AwsFrameInfo*)arg;
      if (info->final && info->index == 0 && info->len == len &&
          info->opcode == WS_TEXT) {
        StaticJsonDocument<1024> reqBuffer;
        auto err = deserializeJson(reqBuffer,
            reinterpret_cast<const char*>(data),
            len);

        if (err) {
          Serial.println(reinterpret_cast<const char*>(data));
          Serial.println("Error processing websocket message");
          Serial.println(err.c_str());
        } else {
          if (reqBuffer["type"] == "resolve") {
            JsonArray variables = reqBuffer[F("variables")];

            StaticJsonDocument<256> responseBuffer;
            responseBuffer["type"] = "resolve";
            JsonArray response = responseBuffer.createNestedArray("body");

            driver->resolveVariables(variables, response);
            size_t len = measureJson(responseBuffer);

            AsyncWebSocketMessageBuffer* buffer = server->makeBuffer(len);
            serializeJson(responseBuffer,
                reinterpret_cast<char*>(buffer->get()),
                len + 1);
            client->text(buffer);
          }
        }
      }
    }
  });
  server.addHandler(&wsServer);

  server.clearBuilders();
  server.begin();
}

void EpaperWebServer::handleFirmwareUpdateUpload(RequestContext& request) {
  if (request.upload.index == 0) {
    // Give up if the filename starts with "INITIALIZER_".  These binary images
    // are built by custom platformio tooling that includes all parts of flash
    // necessary get started (including bootloader and partition table).
    //
    // OTA updates _only_ have the firmware part of this image, and trying to
    // include the other parts will corrupt flash.
    if (request.upload.filename.startsWith("INITIALIZER_")) {
      Serial.println(
          F("Refusing to process OTA update with filename beginning with "
            "INITIALIZER_"));
      request.response.setCode(400);
      request.response.json[F("error")] =
          F("Invalid firmware image.  This is an initializer binary.  Please "
            "choose the firmware image without the INITIALIZER_ prefix.");
      return;
    }

    if (request.rawRequest->contentLength() > 0) {
      if (this->cancelSleepFn) {
        this->cancelSleepFn();
      }

      Update.begin(request.rawRequest->contentLength());
#if defined(ESP8266)
      Update.runAsync(true);
#endif
    }
  }

  if (Update.size() > 0) {
    if (Update.write(request.upload.data, request.upload.length) !=
        request.upload.length) {
      Update.printError(Serial);

#if defined(ESP32)
      Update.abort();
#endif
    }

    if (request.upload.isFinal) {
      if (!Update.end(true)) {
        Update.printError(Serial);
#if defined(ESP32)
        Update.abort();
#endif
      } else {
        this->updateSuccessful = true;
      }
    }
  }
}

void EpaperWebServer::handleFirmwareUpdateComplete(RequestContext& request) {
  // Upload handler can decide that there was something wrong with the upload.
  // Don't reset if that's the case
  if (this->updateSuccessful) {
    request.rawRequest->send(200, "text/plain", "success");
    delay(1000);
    ESP.restart();
  }
}

void EpaperWebServer::handleVariableUpdate(
    const String& name, const String& value) {
  StaticJsonDocument<128> responseBuffer;
  responseBuffer["type"] = "variable";
  JsonObject body = responseBuffer.createNestedObject("body");
  body["k"] = name;
  body["v"] = value;

  size_t len = measureJson(responseBuffer);
  AsyncWebSocketMessageBuffer* buffer = wsServer.makeBuffer(len);
  serializeJson(responseBuffer,
      reinterpret_cast<char*>(buffer->get()),
      len + 1);

  wsServer.textAll(buffer);
}

void EpaperWebServer::handleRegionUpdate(
    const String& regionId, const String& variableName, const String& value) {
  StaticJsonDocument<128> responseBuffer;
  responseBuffer["type"] = "region";
  JsonObject body = responseBuffer.createNestedObject("body");
  body["id"] = regionId;
  body["k"] = variableName;
  body["v"] = value;

  size_t len = measureJson(responseBuffer);
  AsyncWebSocketMessageBuffer* buffer = wsServer.makeBuffer(len);
  serializeJson(responseBuffer,
      reinterpret_cast<char*>(buffer->get()),
      len + 1);

  wsServer.textAll(buffer);
}

void EpaperWebServer::handleNoOp(RequestContext& request) {
  request.response.json[F("success")] = true;
  request.response.setCode(200);
}

void EpaperWebServer::handlePostSystem(RequestContext& request) {
  JsonObject body = request.getJsonBody().as<JsonObject>();
  JsonVariant command = body[F("command")];

  if (command.isNull()) {
    request.response.json[F("error")] = F("Command not specified");
    request.response.setCode(400);
    return;
  }

  String strCommand = command.as<String>();

  if (strCommand.equalsIgnoreCase("reboot")) {
    ESP.restart();
    request.response.json[F("success")] = true;
  } else if (strCommand.equalsIgnoreCase("cancel_sleep")) {
    if (this->cancelSleepFn != nullptr) {
      this->cancelSleepFn();
    }
    request.response.json[F("success")] = true;
  } else {
    request.response.json[F("error")] = F("Unhandled command");
    request.response.setCode(400);
    return;
  }
}

void EpaperWebServer::handleGetSystem(RequestContext& request) {
  // Measure before allocating buffers
  uint32_t freeHeap = ESP.getFreeHeap();

  request.response.json["version"] = QUOTE(EPAPER_TEMPLATES_VERSION);
  request.response.json["variant"] = QUOTE(FIRMWARE_VARIANT);
  request.response.json["free_heap"] = freeHeap;
  request.response.json["sdk_version"] = ESP.getSdkVersion();
  request.response.json["uptime"] = millis();
  request.response.json["deep_sleep_active"] = this->deepSleepActive;
}

void EpaperWebServer::handleDeleteVariable(RequestContext& request) {
  const char* variableName = request.pathVariables.get("variable_name");
  driver->deleteVariable(variableName);

  request.response.json["success"] = true;
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

void EpaperWebServer::handleServeGzip_P(const char* contentType,
    const uint8_t* text,
    size_t length,
    RequestContext& request) {
  _handleServeGzip_P(contentType, text, length, request.rawRequest);
}

void EpaperWebServer::_handleServeGzip_P(const char* contentType,
    const uint8_t* text,
    size_t length,
    AsyncWebServerRequest* request) {
  AsyncWebServerResponse* response =
      request->beginResponse_P(200, contentType, text, length);
  response->addHeader("Content-Encoding", "gzip");
  request->send(response);
}

void EpaperWebServer::handleServeFile(const char* filename,
    const char* contentType,
    const char* defaultText,
    RequestContext& request) {
  if (!serveFile(filename, contentType, request)) {
    if (defaultText) {
      request.response.sendRaw(200, contentType, defaultText);
    } else {
      request.response.setCode(404);
      request.response.json["error"] = F("Not found");
    }
  }
}

bool EpaperWebServer::serveFile(
    const char* file, const char* contentType, RequestContext& request) {
  if (SPIFFS.exists(file)) {
    request.rawRequest->send(SPIFFS, file, contentType);
    return true;
  }

  return false;
}

// ---------
// CRUD handlers for bitmaps
// ---------

void EpaperWebServer::handleCreateBitmapFinish(RequestContext& request) {
  char tmpMetadataFile[32];
  snprintf_P(tmpMetadataFile,
      31,
      PSTR("%s/%s"),
      TMP_DIRECTORY,
      METADATA_FILENAME);

  auto param = request.rawRequest->getParam(F("bitmap"), true, true);

  if (param == nullptr) {
    request.response.json[F("error")] =
        F("file upload named \"bitmap\" not found in request");
    request.response.setCode(400);
    return;
  }

  if (SPIFFS.exists(tmpMetadataFile)) {
    char metadataFile[32];
    snprintf_P(metadataFile,
        31,
        PSTR("%s/%s"),
        BITMAP_METADATA_DIRECTORY,
        param->value().c_str());

    Serial.printf_P(PSTR("%s -> %s\n"), tmpMetadataFile, metadataFile);
    SPIFFS.remove(metadataFile);

    if (SPIFFS.rename(tmpMetadataFile, metadataFile)) {
      request.response.json[F("success")] = true;
      request.response.json[F("metadata_file")] = metadataFile;
    } else {
      SPIFFS.remove(tmpMetadataFile);

      request.response.json[F("error")] =
          F("failure while persisting image metadata");
      request.response.setCode(500);
    }
  } else {
    request.response.json[F("warn")] = F("no metadata.json file found.");
  }
}

void EpaperWebServer::handleListBitmaps(RequestContext& request) {
  JsonArray responseObj = request.response.json.to<JsonArray>();
  listDirectory(BITMAPS_DIRECTORY, responseObj);
  char buffer[32];
  StaticJsonDocument<1024> metadataBuffer;

  for (JsonObject it : responseObj) {
    const char* path = it["name"];

    if (path == nullptr) {
      continue;
    }

    const char* filename = strrchr(path, '/');

    if (filename != nullptr) {
      snprintf(buffer, 31, "%s%s", BITMAP_METADATA_DIRECTORY, filename);

      File f = SPIFFS.open(buffer);

      if (f && f.available()) {
        JsonObject metadata = it.createNestedObject("metadata");

        deserializeJson(metadataBuffer, f);
        f.close();

        // ArduinoJson will make a copy
        metadata.set(metadataBuffer.as<JsonObject>());
      }
    }
  }
}

void EpaperWebServer::handleCreateBitmap(RequestContext& request) {
  if (request.upload.filename == METADATA_FILENAME) {
    handleCreateFile(TMP_DIRECTORY, request);
  } else {
    handleCreateFile(BITMAPS_DIRECTORY, request);
  }
}

void EpaperWebServer::handleShowBitmap(RequestContext& request) {
  const char* filename = request.pathVariables.get("filename");
  String path = String(BITMAPS_DIRECTORY) + "/" + filename;
  request.rawRequest->send(SPIFFS, path, "application/octet-stream");
}

void EpaperWebServer::handleDeleteBitmap(RequestContext& request) {
  const char* filename = request.pathVariables.get("filename");
  String path = String(BITMAPS_DIRECTORY) + "/" + filename;
  handleDeleteFile(path, request);
}

void EpaperWebServer::listDirectory(const char* dirName, JsonArray result) {
#if defined(ESP8266)
  Dir dir = SPIFFS.openDir(dirName);

  while (dir.next()) {
    JsonObject file = result.createNestedObject();
    file["name"] = dir.fileName();
    file["size"] = dir.fileSize();
  }
#elif defined(ESP32)
  File dir = SPIFFS.open(dirName);

  if (!dir || !dir.isDirectory()) {
    Serial.print(F("Path is not a directory - "));
    Serial.println(dirName);

    return;
  }

  while (File dirFile = dir.openNextFile()) {
    JsonObject file = result.createNestedObject();

    file["name"] = String(dirFile.name());
    file["size"] = dirFile.size();
  }
#endif
}

void EpaperWebServer::handleListDirectory(
    const char* dirName, RequestContext& request) {
  JsonArray responseObj = request.response.json.to<JsonArray>();
  listDirectory(dirName, responseObj);
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

void EpaperWebServer::handleDeleteFile(
    const String& path, RequestContext& request) {
  if (SPIFFS.exists(path.c_str())) {
    if (SPIFFS.remove(path.c_str())) {
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

void EpaperWebServer::handleCreateFile(
    const char* filePrefix, RequestContext& request) {
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

  if (!updateFile ||
      updateFile.write(request.upload.data, request.upload.length) !=
          request.upload.length) {
    request.response.setCode(500);
    request.response.json["error"] = F("Failed to write to file");
  }

  if (updateFile && request.upload.isFinal) {
    updateFile.close();
  }
}

void EpaperWebServer::handleUpdateJsonFile(
    const String& path, RequestContext& request) {
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

  if (this->changeFn) {
    this->changeFn();
  }

  request.response.json["success"] = true;
}

void EpaperWebServer::handleGetSettings(RequestContext& request) {
  AsyncResponseStream* stream =
      request.rawRequest->beginResponseStream(APPLICATION_JSON);
  stream->setCode(200);
  settings.dump(*stream);

  request.rawRequest->send(stream);
}

void EpaperWebServer::onSettingsChange(std::function<void()> changeFn) {
  this->changeFn = changeFn;
}

void EpaperWebServer::onCancelSleep(
    EpaperWebServer::OnCancelSleepFn cancelSleepFn) {
  this->cancelSleepFn = cancelSleepFn;
}

void EpaperWebServer::handleGetScreens(RequestContext& request) {
  JsonArray screens = request.response.json.createNestedArray(F("screens"));

  for (auto screen : DisplayTypeHelpers::PANELS_BY_NAME) {
    const char* name = screen.first;
    const GxEPD2::Panel type = screen.second;

    JsonObject info = screens.createNestedObject();
    info[F("name")] = name;

    auto panelSize = DisplayTypeHelpers::PANEL_SIZES.find(type);
    if (panelSize != DisplayTypeHelpers::PANEL_SIZES.end()) {
      auto dimensions = panelSize->second;
      info[F("width")] = dimensions.first;
      info[F("height")] = dimensions.second;
    }

    auto description = DisplayTypeHelpers::PANEL_DESCRIPTIONS.find(type);
    if (description != DisplayTypeHelpers::PANEL_DESCRIPTIONS.end()) {
      info[F("desc")] = description->second;
    }
  }
}

void EpaperWebServer::handleGetFormattedVariables(RequestContext& request) {
  JsonObject req = request.getJsonBody().as<JsonObject>();

  JsonArray variables = req[F("variables")];
  JsonArray response =
      request.response.json.createNestedArray(F("resolved_variables"));

  driver->resolveVariables(variables, response);
}

void EpaperWebServer::handleResolveVariables(RequestContext& request) {
  JsonObject response = request.response.json.createNestedObject("variables");
  driver->dumpRegionValues(response);
}