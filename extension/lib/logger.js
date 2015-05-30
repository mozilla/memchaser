/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { components, Cc, Ci, Cu } = require("chrome");
const unload = require("sdk/system/unload");

const {TextEncoder, OS} = Cu.import("resource://gre/modules/osfile.jsm", {});

const PERMS_DIRECTORY = parseInt("0755", 8);

function Logger(aOptions) {
  aOptions = aOptions || {};
  this._dir = null;
  this._file = null;
  this._active = false;
  this._firstLog = false;

  this.dir = aOptions.dir;

  unload.ensure(this, 'unload');

  this._encoder = new TextEncoder();
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
  },

  get dir() {
    return this._dir;
  },

  set dir(aValue) {
    try {
      // Check if the value is an instance of nsILocalFile
      aValue.QueryInterface(Ci.nsILocalFile);
      this._dir = aValue;
    }
    catch (e) {
      // Otherwise we also support a path
      if (typeof(aValue) === 'string') {
        let dir = Cc['@mozilla.org/file/local;1']
                  .createInstance(Ci.nsILocalFile);
        dir.initWithPath(aValue);
        this._dir = dir;
      }
      else {
        throw new TypeError('A directory can only be a string of the path ' +
                            'or a nsILocalFile');
      }
    }

    // Create the directory if it does not already exist
    if (!this._dir.exists()) {
      this._dir.create(Ci.nsIFile.DIRECTORY_TYPE, PERMS_DIRECTORY);
    }
  }
};

Logger.prototype.unload = function Logger_unload() {
  this.stop();
};

Logger.prototype.prepareFile = function Logger_prepareFile() {
  var file = this.dir.clone();
  file.append(Date.now() + ".log");

  this._file = file;
  this._firstLog = true;
  this._writeAsync('[');
};

Logger.prototype.start = function Logger_start() {
  if (!this.active) {
    this.prepareFile();
    this._active = true;
  }
};

Logger.prototype.stop = function Logger_stop(aCallback) {
  if (this.active) {
    this._active = false;
    this._writeAsync(']', aCallback);
  }
};

Logger.prototype._writeAsync = function Logger_writeAsync(aMessage, aCallback) {
  // For testing purposes send the message to stdout
  //dump(aMessage + '\n');

  function callback(aResult) {
    if (typeof(aCallback) === "function") {
      try {
        aCallback(aResult);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  let array = this._encoder.encode(aMessage);
  let promise = OS.File.open(this.file.path, {write: true, append: true}).then(file => {
    file.write(array).then(bytes => {
      file.close();
      callback(bytes);
    },
    error => {
      file.close();
      callback(error);
    })
  })
  .catch(callback);
}

Logger.prototype.log = function Logger_log(aType, aData, aCallback) {
  if (this.active) {
    var message = JSON.stringify({type: aType, data: aData});

    if (this._firstLog) {
      this._firstLog = false;
    }
    else {
      message = ',' + '\r\n' + message;
    }

    this._writeAsync(message, aCallback);
  }
};

exports.Logger = Logger;
