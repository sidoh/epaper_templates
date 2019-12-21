# weather_dashboard

A dashboard I keep above my desk that displays the following:

* Current time and date
* Current and 5-day weather forecast
* Outside temperature as measured by my ESP8266-connected thermometer
* Number of minutes until the next two [BART](https://bart.gov) trains arive at the station nearest to my home.

#### Preview

<img src="./preview.png" width="400">

### Setup

The important variables to keep updated are:

* `weather_icon` - defines large weather icon on the left.
* `daily_weather_slot0_*` - defines the timestamps, icons, and temperatore for the 5-day forecast.
* `outside_temp` - the temperature at the bottom left of the screen
* `next_train` - BART times

I'm glossing over some of these, but they're visible in the UI.

I keep these updated using a [Node-RED flow](./nodered_flow.json).

### Acknowledgements

* Icons made by [Freepik](https://www.flaticon.com/authors/freepik) on flaticon.com.