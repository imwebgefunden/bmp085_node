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

var sens = new BMP085();

exports.getTemperatureOk_cb = {
    setUp: function(callback) {
        this.dataRegMSB_UT = sens.wire.dataRegMSB_UT;
        sens.wire.dataRegMSB_UT = 0x6622;
        sens.init(function(err, val) {
            callback();
        });
    },
    tearDown: function(callback) {
        sens.wire.dataRegMSB_UT = this.dataRegMSB_UT;
        callback();
    },
    'get temperature should give back a value and no error': function(test) {
        test.expect(2);
        sens.getTemperature(function(err, val) {
            test.ifError(err);
            test.strictEqual(val, 21.8, 'get a wrong value for temperature');
            test.done();
        });
    },
    'get temperature should set UT_B5 and UT_B5_TS': function(test) {
        test.expect(3);
        sens.UT_B5 = 0;
        sens.UT_B5_TS = 0;
        var now = Math.round(+new Date() / 1000);
        sens.getTemperature(function(err, val) {
            test.ifError(err);
            test.strictEqual(sens.UT_B5, 3495.2983786305845, 'get a wrong value for UT_B5');
            test.ok(((now - sens.UT_B5_TS) < 1), 'get a wrong value for UT_B5');
            test.done();
        });
    }
};

exports.getTemperatureFailed_cb = {
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
    'get temperature should give an error and a value "-255" if sensor is not calibrated': function(test) {
        test.expect(2);
        sens.getTemperature(function(err, val) {
            test.strictEqual(err.message, 'sensor not calibrated', 'get a wrong error message for temperature on uncalibrated sensor');
            test.strictEqual(val, -255, 'get a wrong value for temperature');
            test.done();
        });
    }
};
