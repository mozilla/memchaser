var logger = require("memchaser/logger")

exports.test_default_to_not_logging = function(test) {
  test.assert(!logger.isLogging());
};

exports.test_start_logging = function(test) {
  logger.start();
  test.assert(logger.isLogging());
};

exports.test_stop_logging = function(test) {
  logger.start();
  logger.stop();
  test.assert(!logger.isLogging());
};
