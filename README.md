# e-Paper Templates [![Build Status](https://travis-ci.org/sidoh/epaper_templates.svg?branch=master)](https://travis-ci.org/sidoh/epaper_templates) [![release](http://github-release-version.herokuapp.com/github/sidoh/epaper_templates/release.svg?style=flat)](https://github.com/sidoh/epaper_templates/releases/latest) [![License][shield-license]][info-license]

Template-oriented driver for e-paper displays using Arduino.  Define a layout with a JSON template, and update the display by changing variables via a REST API or MQTT.

## Demo

[<img src="https://imgur.com/RhSOGSt.gif" width="400" />](https://youtu.be/Vg_ctuM1Ppc)

## Requirements

1. An ESP32.
2. A WaveShare e-Paper module.  Any module [supported by GxEPD2](https://github.com/ZinggJM/GxEPD2#supported-spi-e-paper-panels-from-good-display) will work.

## Setup

1. Flash your MCU.
   1. With PlatformIO: for example `pio run -e esp32 -t upload`.
   1. Use a pre-compiled binary from the [releases page](https://github.com/sidoh/epaper_templates/releases).
1. Setup WiFi.  A setup AP will appear named `epaper_XXXXXX`.  The default password is **waveshare**.
1. Visit the Web UI to configure further.

## Variables

Displays are made dynamic by binding _variables_ to certain regions.  When variables are updated, the corresponding regions are updated.  There are two ways to update variables:

#### REST API

```
$ curl -v -X PUT -H'Content-Type: application/json' -d '{"variable_name":"variable_value"}' http://epaper-display/api/v1/variables
```

#### MQTT

Configure MQTT using the UI, or use the `/settings` endpoint:

```
$ curl -v -X PUT -H'Content-Type: application/json' -d '{
  "mqtt_server": "deepthought.sidoh.org",
  "mqtt_username": "sidoh",
  "mqtt_password": "hunter2",
  "mqtt_variables_topic_pattern": "template-displays/display1/:variable_name"
}' http://epaper-display/api/v1/settings
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
        "prefix": "/b/",
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

Bitmaps are in a simple compacted format (where each pixel is a single bit).  You can use the Web UI to convert, edit, and resize existing images.  If you prefer to use the API, or want to do this in patch, [here is a ruby script](https://gist.github.com/sidoh/41a06173f1e4714cf573de1d05f1651e#file-png_to_bitfield-rb) that converts a PNG to the bitfield format.

They are referenced via filenames, and can be managed through the REST API:

```
$ curl -X POST -F 'my-bitmap.bin=@path/to/bitmap.bin' http://epaper-display/api/v1/bitmaps
$ curl -v http://epaper-display/api/v1/bitmaps
[{"name":"/b/bitmap.bin","size":512}]
$ curl -X DELETE http://epaper-display/api/v1/bitmaps/bitmap.bin
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
      "static": "/b/bitmap.bin"
    },
    {
      "x": 100,
      "y": 100,
      "w": 64,
      "h": 64,
      "variable": "my_variable",
      "formatter": "cases",
      "args": {
        "prefix": "/b/",
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

### Rectangles

Rectangles of static width can be specified like so:

```json
{
  "rectangles": [
    {
      "style": "outline",
      "x": 50,
      "y": 50,
      "height": {
        "static": 50
      },
      "width": {
        "static": 50
      },
      "color": "black"
    }
  ]
}
```

Rectangles can also have a dynamic dimension (rectangles with both dimensions being dynamic are currently not supported).  For example:

```json
{
  "rectangles": [
    {
      "style": "filled",
      "x": 51,
      "y": 51,
      "height": {
        "static": 488
      },
      "width": {
        "max": 48,
        "variable": "rectangle-width",
        "variable_mode": "percent"
      },
      "color": "black"
    }
  ]
}
```

When `variable_mode` is `percent`, you must specify a `max` as well.  The dimension of the rectangle will then be set to the percent of the specified variable (for example, a value of 50 would mean the rectangle would have half of its dimension).

### Examples

The [examples directory][examples] has a few sample templates.

### Managing templates

Templates can be managed via the REST API:

```
$ curl -X POST -F 'image=@data/path/to/template.json' http://epaper-display/api/v1/templates
$ curl http://epaper-display/api/v1/templates
[{"name":"/t/template.json","size":3527}]
$ curl -X DELETE http://epaper-display/api/v1/templates/template.json
```

### Selecting a template

```
$ curl -X PUT -H'Content-Type:application/json' \
  -d '{"template_path":"/templates/template.json"}' \
  http://epaper-display/api/v1/settings
```

## REST API

The following RESTful routes are available:

1. `/api/v1/variables` - GET, PUT.
1. `/api/v1/templates` - GET, POST.
1. `/api/v1/templates/:template_name` - GET, DELETE, PUT
1. `/api/v1/bitmaps` - GET, POST.
1. `/api/v1/bitmaps/:bitmap_name` - GET, DELETE.
1. `/api/v1/settings` - GET, PUT.
1. `/api/v1/about` - GET.
1. `/firmware` - POST.
1. `/` - GET.

[info-license]:   https://github.com/sidoh/epaper_templates/blob/master/LICENSE
[shield-license]: https://img.shields.io/badge/license-MIT-blue.svg
[examples]:       https://github.com/sidoh/epaper_templates/examples
