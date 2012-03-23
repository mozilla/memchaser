const prefs = require("api-utils/preferences-service");

const config = require('memchaser/config');

exports.test_javascript_mem_log_enabled = function (test) {
  // We have to require the garbage collector to initialize the module
  require("memchaser/garbage-collector");

  test.assert(prefs.get(config.preferences.memory_log));
}
