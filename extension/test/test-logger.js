var { Cc, Ci } = require("chrome");
var { Logger } = require("memchaser/logger")

var dir = Cc["@mozilla.org/file/directory_service;1"]
          .getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);


exports.test_default_to_not_logging = function (test) {
  var logger = new Logger(dir);

  test.assert(!logger.active);
}


exports.test_start_stop_logging = function (test) {
  var logger = new Logger(dir);

  logger.start();
  test.assert(logger.active);

  logger.stop();
  test.assert(!logger.active);

  logger.file.remove(false);
}
