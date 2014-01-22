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

module.exports = {
    'sensor init': function(test) {
        test.expect(2);
        sens.init(function(err, val) {
            test.ok(val, "init should give back true");
            test.ifError(err);
            test.done();
        });
    }
};
