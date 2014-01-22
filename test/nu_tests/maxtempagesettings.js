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

exports.maxTempAgeOk_cb = {
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        sens.setMaxTempAge(1, callback);
    },
    'set maxtempage to 1 should call cb with no error and new value': function(test) {
        test.expect(2);
        sens.setMaxTempAge(1, function(err, nM) {
            test.ifError(err);
            test.strictEqual(nM, 1, 'maxtempage not set');
            test.done();
        });
    },
    'set maxtempage to 60 should call cb with no error and new value': function(test) {
        test.expect(2);
        sens.setMaxTempAge(60, function(err, nM) {
            test.ifError(err);
            test.strictEqual(nM, 60, 'maxtempage not set');
            test.done();
        });
    }
};

exports.wrongSensorModes_cb = {
    setUp: function(callback) {
        sens.init(callback);
    },
    tearDown: function(callback) {
        callback();
    },
    'set wrong maxTempAge should call cb with an error and null': function(test) {
        test.expect(2);
        sens.setMaxTempAge(0, function(err, val) {
            test.strictEqual(err.message, 'wrong maxtempage value in set maxtempage command', 'wrong error message');
            test.strictEqual(val, null, 'value is not null');
            test.done();
        });
    },
    'set wrong maxTempAge should not change the maxTempAge': function(test) {
        test.expect(1);
        sens.setMaxTempAge(61, function(err, val) {
            sens.getMaxTempAge(function(err, val) {
                test.strictEqual(val, 1, "wrong maxtempage changed the maxTempAge");
                test.done();
            });
        });
    },
};
