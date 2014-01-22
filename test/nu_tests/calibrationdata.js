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

exports.calibrationDataReadOk_cb = {
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        callback();
    },
    'read the calibration data and calc the values ': function(test) {
        test.expect(2);
        var expectedCalData = {
            ac1: {
                location: 170,
                value: 6485
            },
            ac2: {
                location: 172,
                value: -1149
            },
            ac3: {
                location: 174,
                value: -14622
            },
            ac4: {
                location: 176,
                value: 32747
            },
            ac5: {
                location: 178,
                value: 25339
            },
            ac6: {
                location: 180,
                value: 18204
            },
            b1: {
                location: 182,
                value: 5498
            },
            b2: {
                location: 184,
                value: 61
            },
            mb: {
                location: 186,
                value: -32768
            },
            mc: {
                location: 188,
                value: -11075
            },
            md: {
                location: 190,
                value: 2432
            }
        };
        sens.readCalibrationData(function(err, val) {
            test.ifError(err);
            test.deepEqual(sens.calibrationRegisters, expectedCalData, 'different values');
            test.done();
        });
    },
    'read the calibration data should give return "true" and no error': function(test) {
        test.expect(2);
        sens.readCalibrationData(function(err, val) {
            test.ifError(err);
            test.ok(val);
            test.done();
        });
    },
    'read the calibration data should set "calibrationState" to "true" ': function(test) {
        test.expect(1);
        sens.readCalibrationData(function(err, val) {
            test.ok(sens.calibrationState);
            test.done();
        });
    }
};

exports.calibrationDataReadFailed_cb = {
    setUp: function(callback) {
        this.oldAc4Reg = sens.wire.ac4; // store only the ac4 value
        sens.wire.ac4 = 0x0000;
        callback();
    },
    tearDown: function(callback) {
        sens.wire.ac4 = this.oldAc4Reg;
        callback();
    },
    'read wrong calibration data (0x0000) should return with an error and false': function(test) {
        test.expect(2);
        sens.readCalibrationData(function(err, val) {
            test.strictEqual(err.message, 'read wrong calibration values', 'get wrong error message');
            test.strictEqual(val, false, 'return is not false');
            test.done();
        });
    },
    'read wrong calibration data (0xFFFF) should return with an error and false': function(test) {
        test.expect(2);
        sens.wire.ac4 = 0xFFFF;
        sens.readCalibrationData(function(err, val) {
            test.strictEqual(err.message, 'read wrong calibration values', 'get wrong error message');
            test.strictEqual(val, false, 'return is not false');
            test.done();
        });
    },
    'read wrong calibration data should set all cal data to "0x0000" ': function(test) {
        test.expect(1);
        var expectedCalData = {
            ac1: {
                location: 170,
                value: 0x00
            },
            ac2: {
                location: 172,
                value: 0x00
            },
            ac3: {
                location: 174,
                value: 0x00
            },
            ac4: {
                location: 176,
                value: 0x00
            },
            ac5: {
                location: 178,
                value: 0x00
            },
            ac6: {
                location: 180,
                value: 0x00
            },
            b1: {
                location: 182,
                value: 0x00
            },
            b2: {
                location: 184,
                value: 0x00
            },
            mb: {
                location: 186,
                value: 0x00
            },
            mc: {
                location: 188,
                value: 0x00
            },
            md: {
                location: 190,
                value: 0x00
            }
        };
        sens.readCalibrationData(function(err, val) {
            test.deepEqual(sens.calibrationRegisters, expectedCalData, 'different values');
            test.done();
        });
    },
    'read wrong calibration data should set "calibrationState" to "false" ': function(test) {
        test.expect(1);
        sens.readCalibrationData(function(err, val) {
            test.strictEqual(sens.calibrationState, false);
            test.done();
        });
    }
};
