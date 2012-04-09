/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// We have to declare it ourselves because the SDK doesn't export it correctly
const Cu = Components.utils;

Cu.import('resource://gre/modules/NetUtil.jsm');
Cu.import('resource://gre/modules/Services.jsm');

const { Cc, Ci } = require('chrome');
const prefs = require('api-utils/preferences-service');
const tabs = require('tabs');
const unload = require('api-utils/unload');
const window_utils = require('window-utils');

const PERMS_DIRECTORY = parseInt('0755', 8);
const PERMS_FILE = parseInt('0655', 8);

function Logger(aOptions) {
  aOptions = aOptions || {};
  this._dir = null;
  this._file = null;
  this._active = false;
  this._firstLog = false;

  this.dir = aOptions.dir;
  // Optionally allows a preference to stay in sync with directory changes
  this.pref = aOptions.pref;

  unload.ensure(this, 'unload');

  // Converter to create input streams out of strings
  this._converter = Cc['@mozilla.org/intl/scriptableunicodeconverter']
                    .createInstance(Ci.nsIScriptableUnicodeConverter);
  this._converter.charset = 'UTF-8';
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
    try {
      this._dir.QueryInterface(Ci.nsILocalFile);
    }
    catch (e) {
      this.notifyInvalidPath();
    }

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
        try {
          let dir = Cc['@mozilla.org/file/local;1']
                    .createInstance(Ci.nsILocalFile);
          dir.initWithPath(aValue);
          this._dir = dir;
        }
        catch (e2) {
          this.notifyInvalidPath();
        }
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

    if (this.pref) {
      prefs.set(this.pref, this._dir.path);
    }
  }
};

Logger.prototype.unload = function Logger_unload() {
  this.stop();
};

Logger.prototype.notifyInvalidPath = function Logger_notifyInvalidPath() {
  this._dir = null;
  let self = this;
  let window = window_utils.activeBrowserWindow;
  window.PopupNotifications.show(
    window.gBrowser.selectedBrowser,
    'loggernotification',
    'Error: The path you have selected is invalid',
    null,
    { label: 'Select Path',
      accessKey: 'S',
      callback: function () {
        let filePicker = Cc['@mozilla.org/filepicker;1']
                         .createInstance(Ci.nsIFilePicker);
        filePicker.init(window, 'The directory where logs are stored',
                        Ci.nsIFilePicker.modeGetFolder)

        let value = filePicker.show();
        if (value === Ci.nsIFilePicker.returnOK) {
          self.dir = filePicker.file;
        }
      }  
    }
  );
};

Logger.prototype.prepareFile = function Logger_prepareFile() {
  var file = this.dir.clone();
  file.append(Date.now() + '.log');

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

Logger.prototype.stop = function Logger_stop(aCallback) {
  if (this.active) {
    this._active = false;
    this._writeAsync(']', aCallback);
  }
};

Logger.prototype._writeAsync = function Logger_writeAsync(aMessage, aCallback) {
  // For testing purposes send the message to stdout
  //dump(aMessage + '\n');

  // Create an output stream to write to file
  var foStream = Cc['@mozilla.org/network/file-output-stream;1']
                 .createInstance(Ci.nsIFileOutputStream);
  foStream.init(this._file, 0x02 | 0x08 | 0x10, PERMS_FILE, foStream.DEFER_OPEN);

  // Write asynchronously to buffer;
  // Input and output streams are closed after write
  var iStream = this._converter.convertToInputStream(aMessage);
  NetUtil.asyncCopy(iStream, foStream, function (status) {
    if (!Components.isSuccessCode(status)) {
      var errorMessage = new Error('Error while writing to file: ' + status);
      console.error(errorMessage);
    }

    if (typeof(aCallback) === 'function') {
      aCallback(status);
    }
  });
};

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
