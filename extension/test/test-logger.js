Components.utils.import('resource://gre/modules/Services.jsm');

const { Cc, Ci } = require("chrome");
const { Logger } = require("memchaser/logger")

const dir = Services.dirsvc.get("TmpD", Ci.nsIFile);

exports.test_default_to_not_logging = function (test) {
  var logger = new Logger({ dir: dir });

  test.assert(!logger.active);
}

exports.test_start_stop_logging = function (test) {
  var logger = new Logger({ dir: dir });

  logger.start();
  test.assert(logger.active);

  logger.stop();
  test.assert(!logger.active);
}

exports.test_log_and_callback = function (test) {
  var logger = new Logger({ dir: dir });

  function verifyOutput(status) {
    var line = {}, lines = [], continueRead;
    try {
      // open an input stream from file
      var istream = Cc["@mozilla.org/network/file-input-stream;1"].
                    createInstance(Ci.nsIFileInputStream);
      istream.init(logger.file, 0x01, parseInt("0444",8), 0);
      istream.QueryInterface(Ci.nsILineInputStream);

      // read lines into array
      do {
        continueRead = istream.readLine(line);
        lines.push(line.value);
      } while (continueRead);
    }
    finally {
      istream.close();
      test.assert(lines[0].indexOf(':50') != -1, 'data');
      test.assert(lines[1].indexOf(':60') != -1, 'data');
      test.assert(lines[2].indexOf(':70') != -1, 'data');
      test.done();
    }
  }

  logger.start();
  logger.log({ GC: 50 });
  logger.log({ GC: 60 });
  logger.log({ GC: 70 }, verifyOutput);

  test.waitUntilDone(2000);
}
