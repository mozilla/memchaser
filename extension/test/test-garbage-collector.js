const prefs = require("api-utils/preferences-service");
const garbage_collector = require("memchaser/garbage-collector")

const MEM_LOGGER_PREF = "javascript.options.mem.log";


exports.test_javascript_mem_log_enabled = function (test) {
  test.assert(prefs.get(MEM_LOGGER_PREF));
}
