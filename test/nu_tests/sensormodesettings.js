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

exports.sensorModesOk_cb = {
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        sens.setSensorMode('ultraHighRes', callback);
    },
    'set sensormode to all modes should call cb with no error and new value': function(test) {
        var modeArr = Object.keys(sens.sensorModes);
        test.expect(1 + (modeArr.length * 2));
        async.eachSeries(modeArr, function(newMode, cB) {
                sens.setSensorMode(newMode, function(err, nM) {
                    test.ifError(err);
                    test.strictEqual(nM, newMode, 'mode not set');
                    cB();
                });
            },
            function(err) {
                test.ifError(err);
                test.done();
            });
    },
};

exports.wrongSensorModes_cb = {
    setUp: function(callback) {
        sens.init(callback);
    },
    tearDown: function(callback) {
        callback();
    },
    'set wrong sensormode should call cb with an error and null': function(test) {
        test.expect(2);
        sens.setSensorMode('powerUp', function(err, val) {
            test.strictEqual(err.message, 'wrong sensormode value in set sensormode command', 'wrong error message');
            test.strictEqual(val, null, 'value is not null');
            test.done();
        });
    },
    'set wrong sensormode should not change the sensormode': function(test) {
        test.expect(1);
        sens.setSensorMode('powerUp', function(err, val) {
            sens.getSensorMode(function(err, val) {
                test.strictEqual(val, 'ultraHighRes', "wrong sensormode changed the sensormode");
            });
            test.done();
        });
    },
};
