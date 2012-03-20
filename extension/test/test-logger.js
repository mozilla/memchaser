Components.utils.import('resource://gre/modules/Services.jsm');


const { Cc, Ci } = require("chrome");
const { Logger } = require("memchaser/logger")

const dir = Services.dirsvc.get("TmpD", Ci.nsIFile);


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
