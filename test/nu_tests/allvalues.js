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

var async = require('async');
var i2cFakeDev = require('../fakedevice/fake_i2c_bmp085_dev.js');
var proxyquire = require('proxyquire').noCallThru();

var BMP085 = proxyquire('./../../bmp085', {
    'i2c': i2cFakeDev
});

//var sens = new BMP085({'sensorMode': 'standard',});
var sens = new BMP085();

exports.getAllValuesOk_cb = {
    setUp: function(callback) {
        this.dataRegMSB_UT = sens.wire.dataRegMSB_UT;
        this.dataRegMSB_UP = sens.wire.dataRegMSB_UP;
        this.dataRegXLSB_UP = sens.wire.dataRegXLSB_UP;
        this.UT_B5 = sens.UT_B5;
        this.UT_B5_TS = sens.UT_B5_TS;
        sens.wire.dataRegMSB_UT = 0x6530;
        sens.wire.dataRegMSB_UP = 0x9BC3;
        sens.wire.dataRegXLSB_UP = 0xA0;
        sens.UT_B5 = 3249.3016932983546;
        sens.UT_B5_TS = Math.round(+new Date() / 1000);
        sens.init(callback);
    },
    tearDown: function(callback) {
        sens.wire.dataRegMSB_UT = this.dataRegMSB_UT;
        sens.wire.dataRegMSB_UP = this.dataRegMSB_UP;
        sens.wire.dataRegXLSB_UP = this.dataRegXLSB_UP;
        sens.UT_B5 = this.UT_B5;
        sens.UT_B5_TS = this.UT_B5_TS;
        callback();
    },
    'get all values should give back an object and no error': function(test) {
        test.expect(2);
        var devData = {
            addr: 0x77,
            type: 'BMP085',
            ts: 0,
            error: null,
            sensValues: {
                devData: {
                    temperature: {
                        unit: '°C',
                        value: 20.3
                    },
                    pressure: {
                        unit: 'hPa',
                        value: 1005.795
                    }
                },
                rawData: {
                    temperature: {
                        addr_0xF6: 0x65,
                        addr_0xF7: 0x30,
                    },
                    pressure: {
                        addr_0xF6: 0x9B,
                        addr_0xF7: 0xC3,
                        addr_0xF8: 0xA0,
                    },
                }
            }
        };
        sens.getAllValues(function(err, val) {
            test.ifError(err);
            // clone the timestamp :)
            devData.ts = val.ts;
            test.deepEqual(val, devData, 'get a wrong result for all data');
            test.done();
        });
    },
    'get all values should read temperature first': function(test) {
        test.expect(2);
        //sens.options.sensorMode = 'ultraHighRes';
        //sens.wire.dataRegMSB_UT = 0x6530;
        //sens.wire.dataRegMSB_UP = 0x9BC3;
        //sens.wire.dataRegXLSB_UP = 0xA0;
        sens.UT_B5_TS = 0;
        var now = Math.round(+new Date() / 1000);
        sens.getAllValues(function(err, val) {
            test.ifError(err);
            //test.strictEqual(val, 1005.795, 'get a wrong value for pressure');
            test.ok(((now - sens.UT_B5_TS) < 1), 'get a wrong value for UT_B5_TS');
            test.done();
        });
    },
};

exports.getAllValuesFailed_cb = {
    setUp: function(callback) {
        // dont'call sens init - cal data wasn't read
        this.oldCalState = sens.calibrationState;
        sens.calibrationState = false;
        callback();
    },
    tearDown: function(callback) {
        sens.calibrationState = this.oldCalState;
        callback();
    },
    'get allValues should give an error and a null value if sensor is not calibrated': function(test) {
        test.expect(2);
        sens.getAllValues(function(err, val) {
            test.strictEqual(err.message, 'sensor not calibrated', 'get a wrong error message for pressure on uncalibrated sensor');
            test.strictEqual(val, null, 'get a wrong value for pressure');
            test.done();
        });
    }
};
