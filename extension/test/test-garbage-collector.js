var prefs = require("sdk/preferences/service");

const config = require("../lib/config");

exports.test_javascript_memory_pref_enabled = function (assert) {
  // We have to require the garbage collector to initialize the module
  var gc = require("../lib/garbage-collector");
  assert.ok(prefs.get(gc.reporter.pref_gc_notifications), "The preference " + gc.reporter.pref_gc_notifications + " is set");
}

require("sdk/test").run(exports);
