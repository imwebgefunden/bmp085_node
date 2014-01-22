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

var i2cFakeDev = function(addr, opts) {
    var self = this;
    self.addr = addr;
    self.ctrlReg = 0x00;
    self.confReg = 0x00;
    self.dataRegMSB_UT = 0x6622;
    self.dataRegMSB_UP = 0x9B88;
    self.dataRegXLSB_UP = 0x80;
    self.ac1 = 0x1955;
    self.ac2 = 0xFB83;
    self.ac3 = 0xC6E2;
    self.ac4 = 0x7FEB;
    self.ac5 = 0x62FB;
    self.ac6 = 0x471C;
    self.b1 = 0x157A;
    self.b2 = 0x003D;
    self.mb = 0x8000;
    self.mc = 0xD4BD;
    self.md = 0x0980;
};

i2cFakeDev.prototype.readBytes = function(cmd, len, callback) {
    var self = this;
    var buf = new Buffer(len);
    var err = null;

    switch (cmd) {
        case 0x80: // ctrl reg
            buf.writeUInt8(self.ctrlReg, 0);
            if (len !== 1) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0x81: // config reg
            buf.writeUInt8(self.confReg, 0);
            if (len !== 1) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xF6: // data reg, 16 bit, one read at temperature, + XSLB on pressure
            if (self.ctrlReg === 0x2E) {
                buf.writeUInt16BE(self.dataRegMSB_UT, 0);
                if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            } else if ((self.ctrlReg === 0x34) || (self.ctrlReg === 0x74) || (self.ctrlReg === 0xB4) || (self.ctrlReg === 0xF4)) {
                buf.writeUInt16BE(self.dataRegMSB_UP, 0);
                if (len === 3) {
                    buf.writeUInt8(self.dataRegXLSB_UP, 2);
                }
                if ((len !== 2) && (len !== 3)) err = new Error('wrong len in readBytes for faked device');
            } else {
                buf.writeUInt8(0, 0);
                err = new Error('ut or up mode not set in fake device');
            }
            break;
        case 0xAA: // AC1, 16 bit, one read
            buf.writeUInt16BE(self.ac1, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xAC: // AC2, 16 bit, one read
            buf.writeUInt16BE(self.ac2, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xAE: // AC3, 16 bit, one read
            buf.writeUInt16BE(self.ac3, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xB0: // AC4, 16 bit, one read
            buf.writeUInt16BE(self.ac4, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xB2: // AC5, 16 bit, one read
            buf.writeUInt16BE(self.ac5, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xB4: // AC6, 16 bit, one read
            buf.writeUInt16BE(self.ac6, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xB6: // B1, 16 bit, one read
            buf.writeUInt16BE(self.b1, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xB8: // B2, 16 bit, one read
            buf.writeUInt16BE(self.b2, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xBA: // MB, 16 bit, one read
            buf.writeUInt16BE(self.mb, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xBC: // MC, 16 bit, one read
            buf.writeUInt16BE(self.mc, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        case 0xBE: // MD, 16 bit, one read
            buf.writeUInt16BE(self.md, 0);
            if (len !== 2) err = new Error('wrong len in readBytes for faked device');
            break;
        default:
            buf.writeUInt8(0, 0);
            err = new Error('not implemented in fake device');
    }

    callback(err, buf);
};

i2cFakeDev.prototype.writeBytes = function(cmd, data, callback) {
    var self = this;
    var err = null;

    if (data.length !== 1) {
        callback(new Error('wrong data len in writeBytes for faked device'), null);
    }

    switch (cmd) {
        case 0xF4: // ctrl reg
            self.ctrlReg = data[0];
            break;
        default:
            err = new Error('not implemented in fake device');
            data.length = 0;
    }
    callback(err, data.length);
};

module.exports = i2cFakeDev;
