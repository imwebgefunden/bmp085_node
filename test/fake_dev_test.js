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
var i2cFakeDev = require('./fakedevice/fake_i2c_bmp085_dev.js');
var proxyquire = require('proxyquire').noCallThru();

var BMP085 = proxyquire('./../bmp085', {
    'i2c': i2cFakeDev
});

var sens = new BMP085();

function d2h(i) {
    return ('0x' + (i + 0x10000).toString(16).substr(-2).toUpperCase());
}

async.series([

        function(cB) {
            sens.init(cB);
        },
        function(cB) {
            sens.getAllValues(function(err, res) {
                if (err) {
                    cB(err, null);
                } else {
                    console.log(res.ts + '\tUT_B5_TS ' + sens.UT_B5_TS + '\tUT_B5: ' + sens.UT_B5);
                    console.log('temperature ' + res.sensValues.devData.temperature.value + '\t0xF6: ' + d2h(res.sensValues.rawData.temperature.addr_0xF6) + ' ' + d2h(res.sensValues.rawData.temperature.addr_0xF7));
                    console.log('pressure    ' + res.sensValues.devData.pressure.value + '\t0xF6: ' + d2h(res.sensValues.rawData.pressure.addr_0xF6) + ' ' + d2h(res.sensValues.rawData.pressure.addr_0xF7) + ' ' + d2h(res.sensValues.rawData.pressure.addr_0xF8));
                    cB();
                }
            });
        },
    ],
    function(err, results) {});
