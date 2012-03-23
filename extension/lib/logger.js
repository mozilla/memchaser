/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource://gre/modules/NetUtil.jsm");

const { Cc, Ci } = require("chrome");

const PERMS_DIRECTORY = parseInt("0777", 8);
const PERMS_FILE = parseInt("0666", 8);

function Logger(aOptions) {
  aOptions = aOptions || {};
  this._dir = aOptions.dir;
  this._foStream = null;
  this._file = null;
  this._active = false;

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
  }
};

Logger.prototype.prepareFile = function Logger_prepareFile() {
  if (!this._dir.exists())
    this._dir.create(Ci.nsIFile.DIRECTORY_TYPE, PERMS_DIRECTORY);
  else if (!this._dir.isDirectory())
    throw Error(this._dir.path + " is not a directory.");

  var file = this._dir.clone();
  file.append(Date.now() + ".log");

  this._file = file;
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
  }
};

Logger.prototype.log = function Logger_log(aType, aData, aCallback) {
  if (this.active) {
    var message = JSON.stringify({type: aType, data: aData});

    // For testing purposes send the message to stdout
    //dump(message + '\n');

    // Create a output stream to write to file
    var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                  .createInstance(Ci.nsIFileOutputStream);
    foStream.init(this._file, 0x02 | 0x08 | 0x10, PERMS_FILE, foStream.DEFER_OPEN);
    var iStream = this._converter.convertToInputStream(message + '\r\n');

    // Write asynchronously to buffer;
    // Input and output streams are closed after write
    NetUtil.asyncCopy(iStream, foStream, function (status) {
      if (!Components.isSuccessCode(status)) {
        var errorMessage = new Error("Error while writing to file: " + status);
        console.error(errorMessage);
      }

      if (aCallback && typeof(aCallback) === "function") {
        aCallback(status);
      }
    });
  }
};

exports.Logger = Logger;
