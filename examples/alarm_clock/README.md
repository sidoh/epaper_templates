# Alarm Clock

I built a little bedside clock that displays:

* The date and time
* The number of hours I've slept (really, the number of hours that have passed since I last turned off my bedside lamps)
* My sleep "progress" -- when full, I've slept for >=8h.

#### Preview

<img src="./preview.png" width="400">

### Setup

The important variables to keep updated are:

* `lights-out-time` - timestamp lights were turned out at.
* `lights-out-time-relative` - number of hours/m that have passed since `lights-out-time`.
* `sleep-time-percent` - % of 8h `lights-out-time-relative` is

I keep these updated using a [Node-RED flow](./nodered_flow.json).