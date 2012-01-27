var {Cc, Ci} = require("chrome");


function Logger(aDir) {
  this._dir = aDir;
  this._logFile = null;

  this.active = false;
}

Logger.prototype = {

  prepareLogFile: function Logger_prepareLogFile() {
    if (!this._dir.isDirectory())
      this._dir.create(Ci.nsIFile.DIRECTORY_TYPE, 0777);

    var file = this._dir.clone();
    file.append(new Date().getTime() + ".log");

    var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                   .createInstance(Ci.nsIFileOutputStream);
    foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
    this._logFile = file;
  },

  start: function Logger_start() {
    if (!this.active) {
      this.prepareLogFile();
      this.active = true;
      console.debug("Logging to '" + this._logFile.path + "' started.");
    }
  },

  stop: function Logger_stop() {
    if (this.active) {
      this.active = false;
      console.debug("Logging to '" + this._logFile.path + "' stopped.");
    }
  },

  log: function Logger_log(data) {
    if (this.active) {
      var foStream = Cc["@mozilla.org/network/file-output-stream;1"].
                     createInstance(Ci.nsIFileOutputStream);

      foStream.init(this._logFile, 0x02 | 0x08 | 0x10, 0666, 0);

      data.timestamp = new Date().getTime();
      var message = JSON.stringify(data);
      console.debug("Logging: '" + message + "'");

      var converter = Cc["@mozilla.org/intl/converter-output-stream;1"].
                      createInstance(Ci.nsIConverterOutputStream);

      converter.init(foStream, "UTF-8", 0, 0);
      converter.writeString(message + '\r\n');
      converter.close();
    }
  }
}

exports.Logger = Logger;
