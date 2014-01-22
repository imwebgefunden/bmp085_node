# Sensor BMP085 for node.js
---
A node.js module for working with the barometric pressure and temperature sensor BMP085 via i2c.

## About the sensor
The BMP085 is a sensor who combines barometric pressure and temperature measurement on a single chip. A breakout with the sensor is available at [adafruit](http://www.adafruit.com/products/391) or [sainsmart](http://www.sainsmart.com/sainsmart-bmp085-digital-pressure-sensor-module-board.html).
This driver/module based on the [datasheet available via adafruit](http://www.adafruit.com/products/391#Downloads).

## Install
```
$ npm install sensor_bmp085
```
#### Raspberry PI
Enable [i2c on your Pi](https://github.com/kelly/node-i2c#raspberry-pi-setup) if you haven't done already. To avoid having to run the i2c tools as root add the ‘pi’ user to the i2c group:
```
sudo adduser pi i2c
```

## Usage
The module is easy to use. You have different config-options 

### Simple Usage
```
var BMP085 = require('sensor_bmp085');

var sense = new BMP085();
sense.init(function(err, val) {
  if (!err) {
    sense.getTemperature(function(error, val) {
      if (!error) {
        console.log(val + ' °C');
        sense.getPressure(function(error, val) {
          if (!error) {
            console.log(val + ' °C');
          }
        });
      }
    });
  }    
});
```
 
### Don't forget to call init()
```ìnit()``` reads the calibration data from sensors EEPROM and sets the given options.

### Options
The default options are:
```
{
  'debug': false,
  'address': 0x77,
  'device': '/dev/i2c-1',
  'sensorMode': 'ultraHighRes',
  'maxTempAge': 1,
}
```

Configure the sensor by supplying an options object to the constructor like:
```
var sense = new BMP085({
  'sensorMode': 'ultraLowPower',
  'maxTempAge': 5,
});
```
### What does 'maxTempAge' mean
For the calculation of the air pressure, a temporary result of the temperature calculation is required. ```maxTempAge``` says how old (in seconds) may be the temperature measurement before a new temperature measurement is required. If the temperature measurement is too old a new one will be started automatically. 

### Getter & Setter for sensor settings
Getter supports only callbacks. Setter supports callbacks and event-emitters - ```sensorSettingChanged``` and ```sensorSettingFailed```. Getter and setter are:
```
getSensorMode(cB) / setSensorMode(newMode, [cB]) / modes: 'ultraLowPower', 'standard', 'highRes', 'ultraHighRes'
getMaxTempAge(cB) / setMaxTempAge(newMode, [cB]) / modes: 1 ... 60 (in seconds)
```

### Light-Measurements
Measurement-functions using a callback and some of them an event-emitter. All events including a timestamp and additional data like the address to determine the sensor, who emitted the event.

* ```getTemperature([cB])``` - the calculated temperature value in °C - emits event ```newSensorValue``` on success or ```sensorValueError``` on error
* ```getPressure([cB])``` - the calculated pressure value in hPa - emits event ```newSensorValue``` on success or ```sensorValueError``` on error
* ```getAllValues([cB])``` - all values (raw and calculated) - emits event ```newSensorValues``` on success or ```sensorValuesError``` on error

## Tests
Because it's not really a good idea to run test in an unknown environment all tests under test using a faked devices and not really your i2c bus. The faked device using a faked i2c-bus which is realised with the proxyquire module.

To run the complete test suite nodeunit is required. The best way is using grunt and the shipped gruntfile which comes with this module.

## Examples
All examples are using a real device on address ```0x77``` on your i2c bus. Be carefully if you have more as one device on your i2c or/and if you don't use the default address for the sensor.

## Licence
The licence is GPL v3 and the module is available at [Bitbucket](https://bitbucket.org/iwg/bmp085_node) and [GitHub](https://github.com/imwebgefunden/bmp085_node).