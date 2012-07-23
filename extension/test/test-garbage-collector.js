const prefs = require("api-utils/preferences-service");

const config = require('memchaser/config');

exports.test_javascript_memory_pref_enabled = function (test) {
  // We have to require the garbage collector to initialize the module
  var gc = require("garbage-collector");

  test.assert(prefs.get(gc.pref_gc_notifications));
}
