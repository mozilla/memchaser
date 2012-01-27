var { Cc, Ci } = require("chrome");


function Logger(aDir) {
  this._dir = aDir;

  this.active = false;
  this.file = null;
}

Logger.prototype = {


  prepareFile: function Logger_prepareFile() {
    if (!this._dir.exists())
      this._dir.create(Ci.nsIFile.DIRECTORY_TYPE, 0777);
    else if (!this._dir.isDirectory())
      throw Error(this._dir.path + " is not a directory.");

    var file = this._dir.clone();
    file.append(new Date().getTime() + ".log");

    var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                   .createInstance(Ci.nsIFileOutputStream);
    foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
    this.file = file;
  },

  start: function Logger_start() {
    if (!this.active) {
      this.prepareFile();
      this.active = true;
      console.debug("Logging to '" + this.file.path + "' started.");
    }
  },

  stop: function Logger_stop() {
    if (this.active) {
      this.active = false;
      console.debug("Logging to '" + this.file.path + "' stopped.");
    }
  },

  log: function Logger_log(data) {
    if (this.active) {
      var foStream = Cc["@mozilla.org/network/file-output-stream;1"].
                     createInstance(Ci.nsIFileOutputStream);

      foStream.init(this.file, 0x02 | 0x08 | 0x10, 0666, 0);

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
