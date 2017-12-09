#include <WebServer.h>

static const char INDEX_FILENAME[] = "/index.html";
static const char TEXT_HTML[] = "text/html";
static const char TEXT_PLAIN[] = "text/plain";
static const char APPLICATION_JSON[] = "application/json";

static const char CONTENT_TYPE_HEADER[] = "Content-Type";

WebServer::WebServer(DisplayTemplateDriver& driver, Settings& settings)
  : driver(driver),
    settings(settings)
{ }

void WebServer::begin() {
  on("/", HTTP_GET, handleServeFile(INDEX_FILENAME, TEXT_HTML));
  on("/index.html", HTTP_POST, sendSuccess(), handleUpdateFile(INDEX_FILENAME));
  on("/variables", HTTP_PUT, [this]() { handleUpdateVariables(); });
  on("/variables", HTTP_GET, handleServeFile(VariableDictionary::FILENAME, APPLICATION_JSON));

  on("/templates", HTTP_GET, handleListTemplates());
  on("/templates", HTTP_POST, [this]() { sendSuccess(); }, handleCreateTemplate());
  onPattern("/templates/:filename", HTTP_DELETE, handleDeleteTemplate());
  onPattern("/templates/:filename", HTTP_GET, handleShowTemplate());
  onPattern("/templates/:filename", HTTP_PUT, handleUpdateTemplate());

  on("/bitmaps", HTTP_GET, handleListBitmaps());
  on("/bitmaps", HTTP_POST, [this]() { sendSuccess(); }, handleCreateBitmap());
  onPattern("/bitmaps/:filename", HTTP_DELETE, handleDeleteBitmap());
  onPattern("/bitmaps/:filename", HTTP_GET, handleShowBitmap());

  on("/settings", HTTP_GET, handleListSettings());
  on("/settings", HTTP_PUT, handleUpdateSettings());

  on("/about", HTTP_GET, handleAbout());

  server.begin();
}

void WebServer::loop() {
  server.handleClient();
}

ESP8266WebServer::THandlerFunction WebServer::handleAbout() {
  return [this]() {
    // Measure before allocating buffers
    uint32_t freeHeap = ESP.getFreeHeap();

    StaticJsonBuffer<50> buffer;
    JsonObject& res = buffer.createObject();

    res["free_heap"] = freeHeap;

    String body;
    res.printTo(body);
    server.send(200, APPLICATION_JSON, body);
  };
}

ESP8266WebServer::THandlerFunction WebServer::sendSuccess() {
  return [this]() {
    server.send(200, APPLICATION_JSON, "true");
  };
}

void WebServer::handleUpdateVariables() {
  DynamicJsonBuffer buffer;
  JsonObject& vars = buffer.parseObject(server.arg("plain"));

  for (JsonObject::iterator itr = vars.begin(); itr != vars.end(); ++itr) {
    driver.updateVariable(itr->key, itr->value);
  }

  server.send(200, "application/json", "true");
}

ESP8266WebServer::THandlerFunction WebServer::handleServeFile(
  const char* filename,
  const char* contentType,
  const char* defaultText) {

  return [this, filename, contentType, defaultText]() {
    if (!serveFile(filename, contentType)) {
      if (defaultText) {
        server.send(200, contentType, defaultText);
      } else {
        server.send(404);
      }
    }
  };
}

bool WebServer::serveFile(const char* file, const char* contentType) {
  if (SPIFFS.exists(file)) {
    File f = SPIFFS.open(file, "r");
    server.streamFile(f, contentType);
    f.close();
    return true;
  }

  return false;
}

// ---------
// CRUD handlers for bitmaps
// ---------

PatternHandler::TPatternHandlerFn WebServer::handleShowBitmap() {
  return [this](const UrlTokenBindings* bindings) {
    if (bindings->hasBinding("filename")) {
      const char* filename = bindings->get("filename");
      String path = String(BITMAP_DIRECTORY_PREFIX) + filename;

      if (SPIFFS.exists(path)) {
        File file = SPIFFS.open(path, "r");
        server.streamFile(file, "application/octet-stream");
        file.close();
      } else {
        server.send(404, TEXT_PLAIN);
      }
    } else {
      server.send_P(400, TEXT_PLAIN, PSTR("You must provide a filename"));
    }
  };
}

PatternHandler::TPatternHandlerFn WebServer::handleDeleteBitmap() {
  return [this](const UrlTokenBindings* bindings) {
    if (bindings->hasBinding("filename")) {
      const char* filename = bindings->get("filename");
      String path = String(BITMAP_DIRECTORY_PREFIX) + filename;

      if (SPIFFS.exists(path)) {
        if (SPIFFS.remove(path)) {
          server.send_P(200, TEXT_PLAIN, PSTR("success"));
        } else {
          server.send_P(500, TEXT_PLAIN, PSTR("Failed to delete file"));
        }
      } else {
        server.send(404, TEXT_PLAIN);
      }
    } else {
      server.send_P(400, TEXT_PLAIN, PSTR("You must provide a filename"));
    }
  };
}

ESP8266WebServer::THandlerFunction WebServer::handleListBitmaps() {
  return [this]() {
    DynamicJsonBuffer buffer;
    JsonArray& responseObj = buffer.createArray();

    Dir bitmapDir = SPIFFS.openDir(BITMAP_DIRECTORY_PREFIX);

    while (bitmapDir.next()) {
      JsonObject& file = buffer.createObject();
      file["name"] = bitmapDir.fileName();
      file["size"] = bitmapDir.fileSize();
      responseObj.add(file);
    }

    String response;
    responseObj.printTo(response);

    server.send(200, APPLICATION_JSON, response);
  };
}

ESP8266WebServer::THandlerFunction WebServer::handleCreateBitmap() {
  return [this]() {
    HTTPUpload& upload = server.upload();

    if (upload.status == UPLOAD_FILE_START) {
      String filename = String(BITMAP_DIRECTORY_PREFIX) + upload.filename;
      updateFile = SPIFFS.open(filename, "w");
    } else if(upload.status == UPLOAD_FILE_WRITE){
      if (updateFile.write(upload.buf, upload.currentSize) != upload.currentSize) {
        Serial.println(F("Error creating bitmap - write failed"));
      }
    } else if (upload.status == UPLOAD_FILE_END) {
      updateFile.close();
    }
  };
}

// ---------
// CRUD handlers for templates
// ---------

PatternHandler::TPatternHandlerFn WebServer::handleShowTemplate() {
  return [this](const UrlTokenBindings* bindings) {
    if (bindings->hasBinding("filename")) {
      const char* filename = bindings->get("filename");
      String path = String(TEMPLATE_DIRECTORY_PREFIX) + filename;

      if (SPIFFS.exists(path)) {
        File file = SPIFFS.open(path, "r");
        server.streamFile(file, APPLICATION_JSON);
        file.close();

        server.send(200, APPLICATION_JSON);
      } else {
        server.send(404, TEXT_PLAIN);
      }
    } else {
      server.send_P(400, TEXT_PLAIN, PSTR("You must provide a filename"));
    }
  };
}

PatternHandler::TPatternHandlerFn WebServer::handleUpdateTemplate() {
  return [this](const UrlTokenBindings* bindings) {
    if (bindings->hasBinding("filename")) {
      const char* filename = bindings->get("filename");
      String path = String(TEMPLATE_DIRECTORY_PREFIX) + filename;
      handleUpdateJsonFile(path);
    }
  };
}

PatternHandler::TPatternHandlerFn WebServer::handleDeleteTemplate() {
  return [this](const UrlTokenBindings* bindings) {
    if (bindings->hasBinding("filename")) {
      const char* filename = bindings->get("filename");
      String path = String(BITMAP_DIRECTORY_PREFIX) + filename;

      if (SPIFFS.exists(path)) {
        if (SPIFFS.remove(path)) {
          server.send_P(200, TEXT_PLAIN, PSTR("success"));
        } else {
          server.send_P(500, TEXT_PLAIN, PSTR("Failed to delete file"));
        }
      } else {
        server.send(404, TEXT_PLAIN);
      }
    } else {
      server.send_P(400, TEXT_PLAIN, PSTR("You must provide a filename"));
    }
  };
}

ESP8266WebServer::THandlerFunction WebServer::handleListTemplates() {
  return [this]() {
    DynamicJsonBuffer buffer;
    JsonArray& responseObj = buffer.createArray();

    Dir bitmapDir = SPIFFS.openDir(TEMPLATE_DIRECTORY_PREFIX);

    while (bitmapDir.next()) {
      JsonObject& file = buffer.createObject();
      file["name"] = bitmapDir.fileName();
      file["size"] = bitmapDir.fileSize();
      responseObj.add(file);
    }

    String response;
    responseObj.printTo(response);

    server.send(200, APPLICATION_JSON, response);
  };
}

ESP8266WebServer::THandlerFunction WebServer::handleCreateTemplate() {
  return [this]() {
    HTTPUpload& upload = server.upload();

    if (upload.status == UPLOAD_FILE_START) {
      String filename = String(TEMPLATE_DIRECTORY_PREFIX) + upload.filename;
      updateFile = SPIFFS.open(filename, "w");
    } else if(upload.status == UPLOAD_FILE_WRITE){
      if (updateFile.write(upload.buf, upload.currentSize) != upload.currentSize) {
        Serial.println(F("Error creating template - write failed"));
      }
    } else if (upload.status == UPLOAD_FILE_END) {
      updateFile.close();
    }
  };
}

void WebServer::handleUpdateJsonFile(const String& path) {
  DynamicJsonBuffer requestBuffer;
  JsonObject& request = requestBuffer.parseObject(server.arg("plain"));

  if (! request.success()) {
    server.send_P(400, TEXT_PLAIN, PSTR("Invalid JSON"));
    return;
  }

  if (SPIFFS.exists(path)) {
    File file = SPIFFS.open(path, "r");

    DynamicJsonBuffer fileBuffer;
    JsonObject& tmpl = fileBuffer.parse(file);
    file.close();

    if (! tmpl.success()) {
      server.send_P(500, TEXT_PLAIN, PSTR("Failed to load template file"));
      return;
    }

    for (JsonObject::iterator itr = request.begin(); itr != request.end(); ++itr) {
      tmpl[itr->key] = itr->value;
    }

    file = SPIFFS.open(path, "w");
    tmpl.printTo(file);
    file.close();

    String body;
    tmpl.printTo(body);
    server.send(200, APPLICATION_JSON, body);
  } else {
    server.send(404, TEXT_PLAIN);
  }
}

ESP8266WebServer::THandlerFunction WebServer::handleUpdateSettings() {
  return [this]() {
    DynamicJsonBuffer buffer;
    JsonObject& req = buffer.parse(server.arg("plain"));

    if (! req.success()) {
      server.send_P(400, TEXT_PLAIN, PSTR("Invalid JSON"));
      return;
    }

    settings.patch(req);
    settings.save();

    server.send(200);
  };
}

ESP8266WebServer::THandlerFunction WebServer::handleListSettings() {
  return [this]() {
    server.send(200, APPLICATION_JSON, settings.toJson());
  };
}

ESP8266WebServer::THandlerFunction WebServer::handleUpdateFile(const char* filename) {
  return [this, filename]() {
    HTTPUpload& upload = server.upload();

    if (upload.status == UPLOAD_FILE_START) {
      updateFile = SPIFFS.open(filename, "w");
    } else if(upload.status == UPLOAD_FILE_WRITE){
      if (updateFile.write(upload.buf, upload.currentSize) != upload.currentSize) {
        Serial.println(F("Error updating web file"));
      }
    } else if (upload.status == UPLOAD_FILE_END) {
      updateFile.close();
    }
  };
}

bool WebServer::isAuthenticated() {
  if (settings.hasAuthSettings()) {
    if (server.authenticate(settings.adminUsername.c_str(), settings.adminPassword.c_str())) {
      return true;
    } else {
      server.send_P(403, TEXT_PLAIN, PSTR("Authentication required"));
      return false;
    }
  } else {
    return true;
  }
}

void WebServer::onPattern(const String& pattern, const HTTPMethod method, PatternHandler::TPatternHandlerFn fn) {
  PatternHandler::TPatternHandlerFn authedFn = [this, fn](const UrlTokenBindings* b) {
    if (isAuthenticated()) {
      fn(b);
    }
  };

  server.addHandler(new PatternHandler(pattern, method, authedFn));
}

void WebServer::on(const String& path, const HTTPMethod method, ESP8266WebServer::THandlerFunction fn) {
  ESP8266WebServer::THandlerFunction authedFn = [this, fn]() {
    if (isAuthenticated()) {
      fn();
    }
  };

  server.on(path, method, authedFn);
}

void WebServer::on(const String& path, const HTTPMethod method, ESP8266WebServer::THandlerFunction fn, ESP8266WebServer::THandlerFunction uploadFn) {
  ESP8266WebServer::THandlerFunction authedFn = [this, fn]() {
    if (isAuthenticated()) {
      fn();
    }
  };

  ESP8266WebServer::THandlerFunction authedUploadFn = [this, uploadFn]() {
    if (isAuthenticated()) {
      uploadFn();
    }
  };

  server.on(path, method, authedFn, authedUploadFn);
}
