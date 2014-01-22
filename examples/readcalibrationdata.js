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
var BMP085 = require('../bmp085');

var sens = new BMP085();

function d2h(i) {
    return ('0x' + (i + 0x10000).toString(16).substr(-4).toUpperCase());
}

sens.init(function(err, val) {
    if (!err) {
        var calRegsArr = Object.keys(sens.calibrationRegisters);
        async.eachSeries(calRegsArr, function(calReg, cB) {
            console.log('register: ' + calReg + '\taddr: ' + d2h(sens.calibrationRegisters[calReg].location) + '\tval: ' + d2h(sens.calibrationRegisters[calReg].value) + ' = ' + sens.calibrationRegisters[calReg].value);
            cB();
        }, function(err) {});
    }
});
