const { Cc, Ci, Cu } = require("chrome"),
      { Trait } = require("traits");
var NetUtil = {};
Cu.import("resource://gre/modules/NetUtil.jsm", NetUtil);
NetUtil = NetUtil.NetUtil;

var Logger = Trait.compose({
  constructor: function Logger(options) {
    this._dir = options.aDir;
    this._foStream = null;
    this._file = null;
    this._active = false;
    
    // Converter to create input streams out of strings
    this._converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                      .createInstance(Components.interfaces.nsIScriptableUnicodeConverter); 
    this._converter.charset = "UTF-8";
  },
  
  get file() this._file,
  
  get active() this._active,
  
  prepareFile: function Logger_prepareFile() {
    if (!this._dir.exists())
      this._dir.create(Ci.nsIFile.DIRECTORY_TYPE, 0777);
    else if (!this._dir.isDirectory())
      throw Error(this._dir.path + " is not a directory.");
  
    var file = this._dir.clone();
    file.append(Date.now() + ".log");
    
    this._file = file;  
  },
  
  start: function Logger_start() {
    if (!this.active) {
      this.prepareFile();
      this._active = true;
      console.debug("Logging to '" + this.file.path + "' started.");
    }
  },
  
  stop: function Logger_stop() {
    if (this.active) {
      this._active = false;
      console.debug("Logging to '" + this.file.path + "' stopped.");
    }
  },
  
  log: function Logger_log(data) {
    if (this.active) {
      data.timestamp = Date.now();
      var message = JSON.stringify(data);
      
      // Create a output stream to write to file
      var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                       .createInstance(Ci.nsIFileOutputStream);
      foStream.init(this._file, 0x02 | 0x08 | 0x10, 0666, 0);
      var iStream = this._converter.convertToInputStream(message + '\r\n');
      
      // Write asynchronously to buffer;
      // Input and output streams are closed after write
      console.debug("Logging: '" + message + "'");
      NetUtil.asyncCopy(iStream, foStream, function(status) {
        if (!Components.isSuccessCode(status)) {
          errorMessage = new Error("Error while writing to file: " + status);
          console.error(errorMessage);
        }
      });
    }
  }
});  
  
exports.Logger = Logger;
