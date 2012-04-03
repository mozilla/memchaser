/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource://gre/modules/NetUtil.jsm");

const { Cc, Ci } = require("chrome");
const unload = require("api-utils/unload");

const PERMS_DIRECTORY = parseInt("0777", 8);
const PERMS_FILE = parseInt("0666", 8);

function Logger(aOptions) {
  aOptions = aOptions || {};
  this._dir = aOptions.dir;
  this._file = null;
  this._active = false;
  this._firstLog = false;

  unload.ensure(this, 'unload');

  // Converter to create input streams out of strings
  this._converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                    .createInstance(Ci.nsIScriptableUnicodeConverter);
  this._converter.charset = "UTF-8";
}

Logger.prototype = {
  get file() {
    return this._file;
  },

  get active() {
    return this._active;
  },

  set active(aValue) {
    if (aValue) {
      this.start();
    }
    else {
      this.stop();
    }
  }
};

Logger.prototype.unload = function Logger_unload() {
  this.stop();
};

Logger.prototype.prepareFile = function Logger_prepareFile() {
  if (!this._dir.exists())
    this._dir.create(Ci.nsIFile.DIRECTORY_TYPE, PERMS_DIRECTORY);
  else if (!this._dir.isDirectory())
    throw new Error(this._dir.path + " is not a directory.");

  var file = this._dir.clone();
  file.append(Date.now() + ".log");

  this._file = file;
  this._firstLog = true;
  this._writeAsync('[' + '\r\n');
};

Logger.prototype.start = function Logger_start() {
  if (!this.active) {
    this.prepareFile();
    this._active = true;
  }
};

Logger.prototype.stop = function Logger_stop() {
  if (this.active) {
    this._active = false;
    this._writeAsync(']');
  }
};

Logger.prototype._writeAsync = function Logger_writeAsync(aMessage, aCallback) {
  // For testing purposes send the message to stdout
  //dump(aMessage + '\n');

  // Create an output stream to write to file
  var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                 .createInstance(Ci.nsIFileOutputStream);
  foStream.init(this._file, 0x02 | 0x08 | 0x10, PERMS_FILE, foStream.DEFER_OPEN);

  // Write asynchronously to buffer;
  // Input and output streams are closed after write
  var iStream = this._converter.convertToInputStream(aMessage);
  NetUtil.asyncCopy(iStream, foStream, function (status) {
    if (!Components.isSuccessCode(status)) {
      var errorMessage = new Error("Error while writing to file: " + status);
      console.error(errorMessage);
    }

    if (typeof(aCallback) === "function") {
      aCallback(status);
    }
  });
}

Logger.prototype.log = function Logger_log(aType, aData, aCallback) {
  if (this.active) {
    var message = JSON.stringify({type: aType, data: aData});

    if (this._firstLog) {
      this._firstLog = false;
    }
    else {
      message = ',' + message;
    }

    message =  message +  '\r\n';
    this._writeAsync(message, aCallback);
  }
};

exports.Logger = Logger;
