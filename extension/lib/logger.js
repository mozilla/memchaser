var {Cc, Ci} = require("chrome");

var logFile;
var logging;

function isLogging() {
  return logging;
}

function createLogFile() {
  var file = Cc["@mozilla.org/file/directory_service;1"].
             getService(Ci.nsIProperties).
             get("ProfD", Ci.nsIFile);
  file.append("memchaser");
  if (!file.exists() || !file.isDirectory() ) {
    file.create(Ci.nsIFile.DIRECTORY_TYPE, 0777);
  }
  file.append(new Date().getTime() + ".log");
  console.debug("Logging at '" + file.path + "'");

  var foStream = Cc["@mozilla.org/network/file-output-stream;1"].
                 createInstance(Ci.nsIFileOutputStream);

  foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
  logFile = file;
}

function start() {
  createLogFile();
  logging = true;
}

function stop() {
  logging = false;
  console.debug("Stopped logging");
}

function log(data) {
  if (isLogging()) {
    var foStream = Cc["@mozilla.org/network/file-output-stream;1"].
                   createInstance(Ci.nsIFileOutputStream);

    foStream.init(logFile, 0x02 | 0x08 | 0x10, 0666, 0);

    data.timestamp = new Date().getTime();
    var message = JSON.stringify(data);
    console.debug("Logging '" + message + "'");

    var converter = Cc["@mozilla.org/intl/converter-output-stream;1"].
                    createInstance(Ci.nsIConverterOutputStream);

    converter.init(foStream, "UTF-8", 0, 0);
    converter.writeString(message + '\r\n');
    converter.close();
  }
}

exports.isLogging = isLogging;
exports.start = start;
exports.stop = stop;
exports.log = log;
