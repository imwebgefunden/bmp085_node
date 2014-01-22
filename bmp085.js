/*
 * This file is part of sensor_bmp085 for node.
 *
 * Bitbucket: https://bitbucket.org/iwg/bmp085_node
 * GitHub   : https://github.com/imwebgefunden/bmp085_node
 *
 * Copyright (C) Thomas Schneider, imwebgefunden@gmail.com
 *
 * sensor_bmp085 for node is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * sensor_bmp085 for node is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with sensor_bmp085 for node. If not, see
 * <http://www.gnu.org/licenses/>.
 */

/* jslint node: true */
"use strict";

var util = require('util');
var Wire = require('i2c');
var events = require('events');
var _ = require('underscore');
var async = require('async');
var debug;
var defaultOptions = {
    'debug': false,
    'address': 0x77,
    'device': '/dev/i2c-1',
    'sensorMode': 'ultraHighRes',
    'maxTempAge': 1,
};

var BMP085 = function(opts) {
    var self = this;

    events.EventEmitter.call(this);
    self.options = _.extend({}, defaultOptions, opts);
    self.calibrationState = false;
    self.UT_B5 = 0; // need on pressure calc
    self.UT_B5_TS = 0; // UT_B5 timestamp
    self.wire = new Wire(this.options.address, {
        device: this.options.device,
        debug: this.options.debug
    });
};

util.inherits(BMP085, events.EventEmitter);

BMP085.prototype.sensorModes = {
    'ultraLowPower': {
        'mask': 0x00,
        'cTime': 5
    },
    'standard': {
        'mask': 0x01,
        'cTime': 8
    },
    'highRes': {
        'mask': 0x02,
        'cTime': 14
    },
    'ultraHighRes': {
        'mask': 0x03,
        'cTime': 26
    }
};

BMP085.prototype.calibrationRegisters = {
    'ac1': {
        'location': 0xAA,
    },
    'ac2': {
        'location': 0xAC,
    },
    'ac3': {
        'location': 0xAE,
    },
    'ac4': {
        'location': 0xB0,
    },
    'ac5': {
        'location': 0xB2,
    },
    'ac6': {
        'location': 0xB4,
    },
    'b1': {
        'location': 0xB6,
    },
    'b2': {
        'location': 0xB8,
    },
    'mb': {
        'location': 0xBA,
    },
    'mc': {
        'location': 0xBC,
    },
    'md': {
        'location': 0xBE,
    },
};

BMP085.prototype.registers = {
    'control': {
        'location': 0xF4,
    },
    'temperatureData': {
        'location': 0xF6,
    },
    'pressureData': {
        'location': 0xF6,
    },
};

BMP085.prototype.init = function(callback) {
    var self = this;

    async.series([

            function(cB) {
                self.setSensorMode(self.options.sensorMode, cB);
            },
            function(cB) {
                self.setMaxTempAge(self.options.maxTempAge, cB);
            },
            function(cB) {
                self.readCalibrationData(cB);
            }
        ],
        function(err, results) {
            var ts = Math.round(+new Date() / 1000);
            var evData = {
                'addr': self.options.address,
                'type': 'BMP085',
                'ts': ts,
                'error': err
            };
            if (err) {
                self.emit('sensorInitFailed', evData);
                if (callback) callback(err, null);
            } else {
                self.emit('sensorInitCompleted', evData);
                if (callback) callback(null, true);
            }
        });
};

BMP085.prototype.readCalibrationData = function(callback) {
    var self = this;
    var calRegsArr = Object.keys(self.calibrationRegisters);

    async.eachSeries(calRegsArr, function(calReg, cB) {
            self.wire.readBytes(self.calibrationRegisters[calReg].location, 2, function(err, bytes) {
                if (!err) {
                    var hi = 0x00;
                    var lo = bytes.readUInt8(1);

                    switch (calReg) {
                        case 'ac4':
                        case 'ac5':
                        case 'ac6':
                            // this are 16 bit unsigned registers
                            hi = bytes.readUInt8(0);
                            break;
                        default:
                            // all others are signed registers
                            hi = bytes.readInt8(0);
                    }
                    if (((hi === 0x00) && (lo === 0x00)) || ((hi === 0xFF) && (lo === 0xFF))) {
                        // 0x0000 or 0xFFFF isn't allowed
                        err = new Error('read wrong calibration values');
                    } else {
                        self.calibrationRegisters[calReg].value = (hi << 8) + lo;
                    }
                }
                cB(err);
            });
        },
        function(err) {
            var ts = Math.round(+new Date() / 1000);
            var evData = {
                'addr': self.options.address,
                'type': 'BMP085',
                'ts': ts,
                'error': err
            };
            if (err) {
                self.calibrationState = false;
                // reset all stored cal values to 0x00
                async.each(calRegsArr, function(calReg, callB) {
                    self.calibrationRegisters[calReg].value = 0x00;
                    callB();
                }, function(err) {});
                self.emit('sensorCalibrationFailed', evData);
                if (callback) callback(err, false);
            } else {
                self.calibrationState = true;
                self.emit('sensorCalibrationCompleted', evData);
                if (callback) callback(null, true);
            }
        });
};

BMP085.prototype.getSensorMode = function(callback) {
    var self = this;
    var modeArr = Object.keys(self.sensorModes);

    callback(null, self.options.sensorMode);
};

BMP085.prototype.setSensorMode = function(newMode, callback) {
    var self = this;
    var ts = Math.round(+new Date() / 1000);
    var evData = {
        'addr': self.options.address,
        'type': 'BMP085',
        'setting': 'sensorMode',
        'newValue': newMode,
        'ts': ts,
        'error': null
    };

    if (_.has(self.sensorModes, newMode) === false) {
        var err = new Error('wrong sensormode value in set sensormode command');
        evData.error = err;
        self.emit('sensorSettingFailed', evData);
        if (callback) callback(err, null);
    } else {
        self.options.sensorMode = newMode;
        self.emit('sensorSettingChanged', evData);
        if (callback) callback(null, newMode);
    }
};

BMP085.prototype.getMaxTempAge = function(callback) {
    var self = this;

    callback(null, self.options.maxTempAge);
};

BMP085.prototype.setMaxTempAge = function(newMode, callback) {
    var self = this;
    var ts = Math.round(+new Date() / 1000);
    var evData = {
        'addr': self.options.address,
        'type': 'BMP085',
        'setting': 'maxTempAge',
        'newValue': newMode,
        'ts': ts,
        'error': null
    };

    if ((newMode < 1) || (newMode > 60)) {
        var err = new Error('wrong maxtempage value in set maxtempage command');
        evData.error = err;
        self.emit('sensorSettingFailed', evData);
        if (callback) callback(err, null);
    } else {
        self.options.maxTempAge = newMode;
        self.emit('sensorSettingChanged', evData);
        if (callback) callback(null, newMode);
    }
};

BMP085.prototype.readTemperature = function(callback) {
    var self = this;
    var readTemperatureCmd = 0x2E;
    var temperatureCTime = 5;
    var hi = 0x00;
    var lo = 0x00;

    async.series([

            function(cB) {
                self.wire.writeBytes(self.registers.control.location, [readTemperatureCmd], function(err) {
                    if (err) {
                        cB(new Error('error on write at read temperature'), null);
                    } else {
                        cB(null, 'write');
                    }
                });
            },
            function(cB) {
                setTimeout(function() {
                    self.wire.readBytes(self.registers.temperatureData.location, 2, function(err, bytes) {
                        if (err) {
                            cB(new Error('error on read at read temperature'), null);
                        } else {
                            hi = bytes.readUInt8(0);
                            lo = bytes.readUInt8(1);
                            cB(null, 'read');
                        }
                    });
                }, temperatureCTime);
            }
        ],
        function(err, results) {
            if (err) {
                if (callback) callback(err, null);
            } else {
                if (callback) callback(null, ((hi << 8) + lo));
            }
        }
    );
};

BMP085.prototype.calcTemperature = function(rawValue) {
    var self = this;
    var x1 = ((rawValue - self.calibrationRegisters.ac6.value) * self.calibrationRegisters.ac5.value) >> 15;
    var x2 = (self.calibrationRegisters.mc.value << 11) / (x1 + self.calibrationRegisters.md.value);
    var b5 = x1 + x2;
    self.UT_B5 = b5; // needed for pressure calc
    self.UT_B5_TS = Math.round(+new Date() / 1000); // UT_B5 timestamp
    var temperature = ((b5 + 8) >> 4) / 10;
    return (temperature);
};

BMP085.prototype.getTemperature = function(callback) {
    var self = this;

    async.waterfall([

            function(cB) {
                if (self.calibrationState !== true) {
                    cB(new Error('sensor not calibrated'), -255);
                } else {
                    cB(null, 'calibrated');
                }
            },
            function(arg1, cB) {
                self.readTemperature(cB);
            },
            function(tempRawVal, cB) {
                cB(null, self.calcTemperature(tempRawVal));
            },
        ],
        function(err, result) {
            var ts = Math.round(+new Date() / 1000);
            var evData = {
                'addr': self.options.address,
                'type': 'BMP085',
                'valType': 'temperature',
                'ts': ts,
                'error': err,
                'sensVal': -255
            };
            if (err) {
                self.emit('sensorValueError', evData);
                if (callback) callback(err, -255);
            } else {
                evData.sensVal = result;
                self.emit('newSensorValue', evData);
                if (callback) callback(null, result);
            }
        });
};

BMP085.prototype.readPressure = function(callback) {
    var self = this;
    var readPressureCmd = 0x34 + (self.sensorModes[self.options.sensorMode].mask << 6);
    var pressureCTime = self.sensorModes[self.options.sensorMode].cTime;
    var msb = 0x00;
    var lsb = 0x00;
    var xlsb = 0x00;

    async.series([

            function(cB) {
                self.wire.writeBytes(self.registers.control.location, [readPressureCmd], function(err) {
                    if (err) {
                        cB(new Error('error on write at read pressure'), null);
                    } else {
                        cB(null, 'write');
                    }
                });
            },
            function(cB) {
                setTimeout(function() {
                    self.wire.readBytes(self.registers.pressureData.location, 3, function(err, bytes) {
                        if (err) {
                            cB(new Error('error on read at read pressure'), null);
                        } else {
                            msb = bytes.readUInt8(0);
                            lsb = bytes.readUInt8(1);
                            xlsb = bytes.readUInt8(2);
                            self.UP_MSB = msb;
                            self.UP_LSB = lsb;
                            self.UP_XLSB = xlsb;
                            cB(null, 'read');
                        }
                    });
                }, pressureCTime);
            }
        ],
        function(err, results) {
            if (err) {
                if (callback) callback(err, null);
            } else {
                var val = ((msb << 16) + (lsb << 8) + xlsb) >> (8 - self.sensorModes[self.options.sensorMode].mask);
                if (callback) callback(null, val);
            }
        }
    );
};

BMP085.prototype.calcPressure = function(rawValue) {
    var self = this;
    var p;
    var b6 = self.UT_B5 - 4000;
    var x1 = (self.calibrationRegisters.b2.value * (b6 * b6) >> 12) >> 11;
    var x2 = (self.calibrationRegisters.ac2.value * b6) >> 11;
    var x3 = x1 + x2;
    var b3 = (((self.calibrationRegisters.ac1.value * 4 + x3) << self.sensorModes[self.options.sensorMode].mask) + 2) / 4;

    x1 = (self.calibrationRegisters.ac3.value * b6) >> 13;
    x2 = (self.calibrationRegisters.b1.value * ((b6 * b6) >> 12)) >> 16;
    x3 = ((x1 + x2) + 2) >> 2;
    var b4 = (self.calibrationRegisters.ac4.value * (x3 + 32768)) >> 15;
    var b7 = (rawValue - b3) * (50000 >> self.sensorModes[self.options.sensorMode].mask);

    if (b7 < 0x80000000) {
        p = (b7 * 2) / b4;
    } else {
        p = (b7 / b4) * 2;
    }

    x1 = (p >> 8) * (p >> 8);
    x1 = (x1 * 3038) >> 16;
    x2 = (-7375 * p) >> 16;

    p = p + ((x1 + x2 + 3791) >> 4);
    p = p / 100; // hPa

    return (Math.round(p * 1000) / 1000); // dec with .xxx)

};

BMP085.prototype.getPressure = function(callback) {
    var self = this;
    var now = Math.round(+new Date() / 1000);

    async.waterfall([

            function(cB) {
                if (self.calibrationState !== true) {
                    cB(new Error('sensor not calibrated'), -255);
                } else {
                    cB(null, 'calibrated');
                }
            },
            function(arg1, cB) {
                if ((now - self.UT_B5_TS) > self.options.maxTempAge) {
                    self.readTemperature(function(err, val) {
                        if (err) {
                            cB(err, null);
                        } else {
                            self.calcTemperature(val);
                            cB(null, 'temerature read');
                        }
                    });
                } else {
                    cB(null, 'temperature age is okay');
                }
            },
            function(arg1, cB) {
                self.readPressure(cB);
            },
            function(pressRawVal, cB) {
                cB(null, self.calcPressure(pressRawVal));
            },
        ],
        function(err, result) {
            var ts = Math.round(+new Date() / 1000);
            var evData = {
                'addr': self.options.address,
                'type': 'BMP085',
                'valType': 'pressure',
                'ts': ts,
                'error': err,
                'sensVal': -255
            };
            if (err) {
                self.emit('sensorValueError', evData);
                if (callback) callback(err, -255);
            } else {
                evData.sensVal = result;
                self.emit('newSensorValue', evData);
                if (callback) callback(null, result);
            }
        });
};

BMP085.prototype.getAllValues = function(callback) {
    var self = this;
    var UT_MSB = 0x00;
    var UT_LSB = 0x00;
    var UP_MSB = 0x00;
    var UP_LSB = 0x00;
    var UP_XLSB = 0x00;
    var temperature;
    var pressure;

    async.series([

            function(cB) {
                if (self.calibrationState !== true) {
                    cB(new Error('sensor not calibrated'), -255);
                } else {
                    cB(null, 'calibrated');
                }
            },
            function(cB) {
                self.readTemperature(function(err, val) {
                    if (err) {
                        cB(new Error('temperature read failed'), -255);
                    } else {
                        UT_MSB = (val >> 8);
                        UT_LSB = (val & 0x00FF);
                        temperature = self.calcTemperature(val);
                        cB(null, 'temperature');
                    }
                });
            },
            function(cB) {
                self.readPressure(function(err, val) {
                    if (err) {
                        cB(new Error('pressure read failed'), -255);
                    } else {
                        UP_MSB = self.UP_MSB;
                        UP_LSB = self.UP_LSB;
                        UP_XLSB = self.UP_XLSB;
                        pressure = self.calcPressure(val);
                        cB(null, 'pressure');
                    }
                });
            },
        ],
        function(err, results) {
            var ts = Math.round(+new Date() / 1000);
            var evData = {
                'addr': self.options.address,
                'type': 'BMP085',
                'ts': ts,
                'error': err
            };
            if (err) {
                self.emit('sensorValuesError', evData);
                if (callback) callback(err, null);
            } else {
                var devData = {
                    devData: {
                        temperature: {
                            unit: '°C',
                            value: temperature,
                        },
                        pressure: {
                            unit: 'hPa',
                            value: pressure,
                        },
                    },
                    rawData: {
                        temperature: {
                            addr_0xF6: UT_MSB,
                            addr_0xF7: UT_LSB,
                        },
                        pressure: {
                            addr_0xF6: UP_MSB,
                            addr_0xF7: UP_LSB,
                            addr_0xF8: UP_XLSB,
                        },
                    }
                };
                evData.sensValues = devData;
                self.emit('newSensorValues', evData);
                if (callback) callback(null, evData);
            }
        }
    );
};

module.exports = BMP085;
