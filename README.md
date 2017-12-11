# e-Paper Templates
Template-oriented driver for e-paper displays using Arduino.  Define a layout with a JSON template, and update the display by changing variables via a REST API or MQTT.

[![Build Status](https://travis-ci.org/sidoh/epaper_templates.svg?branch=master)](https://travis-ci.org/sidoh/epaper_templates)
[![release](http://github-release-version.herokuapp.com/github/sidoh/epaper_templates/release.svg?style=flat)](https://github.com/sidoh/epaper_templates/releases/latest)
[![License][shield-license]][info-license]

## Requirements

1. ESP8266/ESP32.  The entire display frame is buffered in memory, so ESP32 may be a more suitable for large displays.
2. A WaveShare e-Paper module.  Currently only the 4.2" black/white display is supported.

## Setup

1. Flash your MCU.  
   1. With PlatformIO: for example `pio run -e esp32 -t upload`.
   1. Use a pre-compiled binary from the [releases page](https://github.com/sidoh/epaper_templates/releases).
1. Setup WiFi.  A setup AP will appear named `epaper_XXXXXX`.  The default password is **waveshare**.

## Variables

Displays are made dynamic by binding _variables_ to certain regions.  When variables are updated, the corresponding regions are updated.  There are two ways to update variables:

#### REST API

```
$ curl -v -X PUT -H'Content-Type: application/json' -d '{"variable_name":"variable_value"}' http://epaper-display/variables
```

#### MQTT

Configure MQTT using the `/settings` endpoint:

```
$ curl -v -X PUT -H'Content-Type: application/json' -d '{
  "mqtt_server": "deepthought.sidoh.org",
  "mqtt_username": "sidoh",
  "mqtt_password": "hunter2",
  "mqtt_variables_topic_pattern": "template-displays/display1/:variable_name"
}' http://epaper-display/settings
```

You can then publish messages to, for example `template-displays/display1/variable_name` to update the value of the variable `variable_name`.

```
mosquitto_pub -h my-mqtt-broker.com -u username -P hunter2 -t 'template-displays/display1/variable_name' -m "variable_value"
```

### Formatters

Variables can optionally be passed through a formatting function before being rendered.  The supported formatters are:

#### `time` 

Format a UNIX epoch timestamp using standard [`strftime`](http://man7.org/linux/man-pages/man3/strftime.3.html) flags.

```json
{
  "text": [
    {
      "x": 100,
      "y": 100,
      "font": "FreeSansBold9pt7b",
      "color": "black",
      "variable": "my_variable",
      "formatter": "time",
      "args": {
        "timezone": "PT",
        "format": "%l:%M %p"
      }
    }
  ]
}
```

The timestamp will be converted to the provided timezone if one is specified.

#### `cases`

Simple map from key to value.  Particularly useful for variable bitmaps:

```json
{
  "bitmaps": [
    {
      "x": 100,
      "y": 100,
      "w": 64,
      "h": 64,
      "variable": "my_variable",
      "formatter": "cases",
      "args": {
        "prefix": "/bitmaps/",
        "default": "unknown.bin",
        "cases": {
          "sunny": "sunny.bin",
          "cloudy": "cloudy.bin"
        }
      }
    }
  ]
}
```

## Templates

Templates are composed of the following types of components:

1. Lines
2. Text
3. Bitmaps

### Lines

Lines simply have start and end coordinates.  You can optionally specify a color.  Example:

```json
{
  "lines": [
    {"x1": 0, "x2": 100, "y1": 0, "y2": 100, "color": "black"}
  ]
}
```

### Text

Text can be defined statically, or using a variable.  Examples of each:

```json
{
  "text": [
      {
      "x": 10,
      "y": 220,
      "font": "FreeSansBold9pt7b",
      "static": "Outside"
    },
    {
      "x": 120,
      "y": 220,
      "font": "FreeSans9pt7b",
      "variable": "outside_temp_updated_at",
      "formatter": "Time",
      "args": {
        "timezone": "PT",
        "format": "%l:%M %p"
      }
    },
    {
      "x": 10,
      "y": 275,
      "font": "FreeMonoBold24pt7b",
      "variable": "outside_temp"
    }
  ]
}
```

### Bitmaps

Bitmaps are in a special compacted format.  [Here is a ruby script](https://gist.github.com/sidoh/41a06173f1e4714cf573de1d05f1651e#file-png_to_bitfield-rb) that converts a PNG to the bitfield format.

They are referenced via filenames, and can be managed through the REST API:

```
$ curl -X POST -F 'my-bitmap.bin=@path/to/bitmap.bin' http://epaper-display/bitmaps
$ curl -v http://epaper-display/bitmaps
[{"name":"/bitmaps/bitmap.bin","size":512}]
$ curl -X DELETE http://epaper-display/bitmaps/bitmap.bin
```

Example:

```json
{
  "bitmaps": [
    {
      "x": 0,
      "y": 0,
      "w": 64,
      "h": 64,
      "color": "black",
      "static": "/bitmaps/bitmap.bin"
    },
    {
      "x": 100,
      "y": 100,
      "w": 64,
      "h": 64,
      "variable": "my_variable",
      "formatter": "cases",
      "args": {
        "prefix": "/bitmaps/",
        "default": "unknown.bin",
        "cases": {
          "sunny": "sunny.bin",
          "cloudy": "cloudy.bin"
        }
      }
    }
  ]
}
```

### Examples

The [examples directory][examples] has a few sample templates.

### Managing templates

Templates can be managed via the REST API:

```
$ curl -X POST -F 'image=@data/path/to/template.json' http://epaper-display/templates
$ curl http://epaper-display/templates
[{"name":"/templates/template.json","size":3527}]
$ curl -X DELETE http://epaper-display/templates/template.json
```

### Selecting a template

```
$ curl -X PUT -H'Content-Type:application/json' \
  -d '{"template_path":"/templates/template.json"}' \
  http://epaper-display/settings
```

## REST API

The following RESTful routes are available:

1. `/variables` - GET, PUT.
1. `/templates` - GET, POST.
1. `/templates/:template_name` - GET, DELETE, PUT
1. `/bitmaps` - GET, POST.
1. `/bitmaps/:bitmap_name` - GET, DELETE.
1. `/settings` - GET, PUT.
1. `/about` - GET.
1. `/` - GET.

[info-license]:   https://github.com/sidoh/epaper_templates/blob/master/LICENSE
[shield-license]: https://img.shields.io/badge/license-MIT-blue.svg
[examples]:       https://github.com/sidoh/epaper_templates/examples
