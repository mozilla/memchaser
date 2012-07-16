const prefs = require("api-utils/preferences-service");

const config = require('memchaser/config');

exports.test_javascript_memory_pref_enabled = function (test) {
  // We have to require the garbage collector to initialize the module
  require("memchaser/garbage-collector");

  var memory_pref;
  if (config.application.branch >= 16) {
    memory_pref = config.preferences.memory_notify;
  }
  else {
    memory_pref = config.preferences.memory_log;
  }
  test.assert(prefs.get(memory_pref));
}