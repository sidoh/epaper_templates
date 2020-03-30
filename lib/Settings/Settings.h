#include <EnvironmentConfig.h>
#include <functional>
#include <ArduinoJson.h>
#include <Timezone.h>
#include <Timezones.h>
#include <Bleeper.h>
#include <GxEPD2.h>
#include <GxEPD2_GFX.h>
#include <DisplayTypeHelpers.h>
#include <AuthProviders.h>
#include <types/SleepMode.h>

#ifndef _SETTINGS_H
#define _SETTINGS_H

#ifndef BITMAPS_DIRECTORY
#define BITMAPS_DIRECTORY "/b"
#endif

#ifndef TEMPLATES_DIRECTORY
#define TEMPLATES_DIRECTORY "/t"
#endif

static const char BITMAP_METADATA_DIRECTORY[] = "/m";

#define XQUOTE(x) #x
#define QUOTE(x) XQUOTE(x)

#ifndef FIRMWARE_VARIANT
#define FIRMWARE_VARIANT unknown
#endif

#ifndef EPAPER_TEMPLATES_VERSION
#define EPAPER_TEMPLATES_VERSION unknown
#endif

#ifndef MILIGHT_MAX_STATE_ITEMS
#define MILIGHT_MAX_STATE_ITEMS 100
#endif

#ifndef JSON_TEMPLATE_BUFFER_SIZE
// 20 KB
#define JSON_TEMPLATE_BUFFER_SIZE 20048
#endif

#ifndef MILIGHT_MAX_STALE_MQTT_GROUPS
#define MILIGHT_MAX_STALE_MQTT_GROUPS 10
#endif

#define SETTINGS_FILE  "/config.json"
#define SETTINGS_TERMINATOR '\0'

#define DEFAULT_MQTT_PORT 1883

static const char DEFAULT_DISPLAY_NAME[] = "epaper-display";

class MqttSettings : public Configuration {
public:
  persistentStringVar(username, "");
  persistentStringVar(password, "");
  persistentStringVar(server, "");
  persistentStringVar(variables_topic_pattern, "");
  persistentStringVar(client_status_topic, "")

  String serverHost() const;
  uint16_t serverPort() const;
};

class WebSettings : public Configuration {
public:
  persistentStringVar(admin_username, "");
  persistentStringVar(admin_password, "");
  persistentIntVar(port, 80);

  bool isAuthenticationEnabled() const;
  const String& getUsername() const;
  const String& getPassword() const;
};

class HardwareSettings : public Configuration {
public:
  persistentVar(
    uint8_t,
    spi_bus,
    EPD_DEFAULT_SPI_BUS,
    {
      if (spi_busString.equalsIgnoreCase("vspi")) {
        spi_bus = VSPI;
      } else {
        spi_bus = HSPI;
      }
    },
    {
      if (spi_bus == VSPI) {
        spi_busString = "VSPI";
      } else {
        spi_busString = "HSPI";
      }
    }
  );
  persistentIntVar(dc_pin, EPD_DEFAULT_DC_PIN);
  persistentIntVar(rst_pin, EPD_DEFAULT_RST_PIN);
  persistentIntVar(busy_pin, EPD_DEFAULT_BUSY_PIN);
};

class NetworkSettings : public Configuration {
public:
  persistentStringVar(hostname, DEFAULT_DISPLAY_NAME);
  persistentStringVar(mdns_name, DEFAULT_DISPLAY_NAME);
  persistentStringVar(setup_ap_password, "waveshare");
  persistentStringVar(wifi_ssid, "");
  persistentStringVar(wifi_password, "");
};

class DisplaySettings : public Configuration {
public:
  persistentStringVar(template_name, "");
  persistentVar(
    uint64_t,
    full_refresh_period,
    3600000,
    {
      full_refresh_period = atol(full_refresh_periodString.c_str());
    },
    {
      const int n = snprintf(NULL, 0, "%llu", full_refresh_period);
      char buf[n+1];
      snprintf(buf, n+1, "%llu", full_refresh_period);
      full_refresh_periodString = String(buf);
    }
  );
  persistentVar(
    GxEPD2::Panel,
    display_type,
    DisplayTypeHelpers::DEFAULT_PANEL,
    {
      display_type = DisplayTypeHelpers::stringToDisplayType(display_typeString);
    },
    {
      display_typeString = DisplayTypeHelpers::displayTypeToString(display_type);
    }
  );
  persistentVar(
    bool,
    windowed_updates,
    false,
    {
      windowed_updates = windowed_updatesString.equalsIgnoreCase("true");
    },
    {
      windowed_updatesString = (windowed_updates ? "true" : "false");
    }
  )
};

class SystemSettings : public Configuration {
public:
  persistentVar(
    Timezone*,
    timezone,
    &TimezonesClass::DEFAULT_TIMEZONE,
    {
      timezone = &Timezones.getTimezone(timezoneString);
    },
    {
      timezoneString = Timezones.getTimezoneName(*timezone);
    }
  );
};

class PowerSettings : public Configuration {
public:
  persistentVar(
    SleepMode,
    sleep_mode,
    SleepModeHelpers::DEFAULT_SLEEP_MODE,
    {
      sleep_mode = SleepModeHelpers::parseName(sleep_modeString.c_str());
    },
    {
      sleep_modeString = SleepModeHelpers::getName(sleep_mode);
    }
  );
  persistentIntVar(sleep_override_pin, EPD_DEFAULT_SLEEP_OVERRIDE_PIN);
  persistentIntVar(sleep_override_value, HIGH);
  // in seconds
  persistentIntVar(sleep_duration, 600);
  // in seconds
  persistentIntVar(awake_duration, 30);
};

class Settings : public RootConfiguration {
public:
  subconfig(SystemSettings, system);
  subconfig(DisplaySettings, display);
  subconfig(NetworkSettings, network);
  subconfig(HardwareSettings, hardware);
  subconfig(WebSettings, web);
  subconfig(MqttSettings, mqtt);
  subconfig(PowerSettings, power);

  void save();
  void patch(JsonObject obj);
  void dump(Print& s);
  void dumpSchema(Print& s);
};

class SettingsCallbackObserver : public ConfigurationObserver {
public:
  using CallbackFn = std::function<void(const ConfigurationPropertyChange)>;

  SettingsCallbackObserver(CallbackFn callback);
  void onConfigurationChanged(const ConfigurationPropertyChange value);

private:
  CallbackFn callback;
};

#endif