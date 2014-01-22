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

exports.getPressureOk_cb = {
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
    'get pressure in mode "ultraHighRes" should give back a value and no error': function(test) {
        test.expect(2);
        sens.getPressure(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 1005.795, 'get a wrong value for pressure');
            test.done();
        });
    },
    'get pressure in mode "ultraLowPower" should give back a value and no error': function(test) {
        test.expect(2);
        sens.options.sensorMode = 'ultraLowPower';
        sens.wire.dataRegMSB_UP = 0x9BC4;
        sens.wire.dataRegXLSB_UP = 0x00;
        sens.UT_B5 = 3253.268923590416;
        sens.getPressure(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 1005.896, 'get a wrong value for pressure');
            test.done();
        });
    },
    'get pressure in mode "standard" should give back a value and no error': function(test) {
        test.expect(2);
        sens.options.sensorMode = 'standard';
        sens.wire.dataRegMSB_UP = 0x9BC5;
        sens.wire.dataRegXLSB_UP = 0x80;
        sens.UT_B5 = 3249.3016932983546;
        sens.getPressure(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 1005.866, 'get a wrong value for pressure');
            test.done();
        });
    },
    'get pressure in mode "highRes" should give back a value and no error': function(test) {
        test.expect(2);
        sens.options.sensorMode = 'highRes';
        sens.wire.dataRegMSB_UP = 0x9BC4;
        sens.wire.dataRegXLSB_UP = 0x00;
        sens.UT_B5 = 3249.3016932983546;
        sens.getPressure(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 1005.804, 'get a wrong value for pressure');
            test.done();
        });
    },
    'get pressure without a valid temperature value should read temperature first': function(test) {
        test.expect(3);
        sens.options.sensorMode = 'ultraHighRes';
        sens.wire.dataRegMSB_UT = 0x6530;
        sens.wire.dataRegMSB_UP = 0x9BC3;
        sens.wire.dataRegXLSB_UP = 0xA0;
        sens.UT_B5_TS = 0;
        var now = Math.round(+new Date() / 1000);
        sens.getPressure(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 1005.795, 'get a wrong value for pressure');
            test.ok(((now - sens.UT_B5_TS) < 1), 'get a wrong diff for UT_B5_TS');
            test.done();
        });
    },
};

exports.getPressureFailed_cb = {
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
    'get pressure should give an error and a value "-255" if sensor is not calibrated': function(test) {
        test.expect(2);
        sens.getPressure(function(err, val) {
            test.strictEqual(err.message, 'sensor not calibrated', 'get a wrong error message for pressure on uncalibrated sensor');
            test.strictEqual(val, -255, 'get a wrong value for pressure');
            test.done();
        });
    }
};
