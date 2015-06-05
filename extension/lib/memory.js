/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Cc, Ci, Cu } = require("chrome");
const { emit, on, off } = require("sdk/event/core");
const prefs = require("sdk/preferences/service");
const self = require("sdk/self");
const timer = require("sdk/timers");
const unload = require("sdk/system/unload");

const config = require("./config");

Cu.import('resource://gre/modules/Services.jsm');

var memSrv = Cc["@mozilla.org/memory-reporter-manager;1"]
             .getService(Ci.nsIMemoryReporterManager);

var interval;
var _timer;


var reporter = {
  name: "memoryReporter"
}

/**
  * Retrieve memory statistics
  */
reporter.retrieveStatistics = function Reporter_retrieveStatistics() {
  var data = {
    timestamp:  Date.now(),
    //explicit: memSrv.explicit,
    resident: memSrv.residentFast
  }

  emit(reporter, config.application.topic_memory_statistics, data);
}

var init = function () {
  // TODO: Reading the pref should be moved out of this module
  interval = prefs.get(config.preferences.memory_poll_interval,
                      config.extension.memory_poll_interval_default);
  _timer = timer.setInterval(reporter.retrieveStatistics, interval);

  reporter.on = on.bind(null, reporter);
  reporter.off = off.bind(null, reporter);

  // Make sure we clean-up correctly
  unload.when ((reason) => {
    off(reporter);
    timer.clearInterval(_timer);
  });
}

var minimizeMemory = function (aCallback) {
  Services.obs.notifyObservers(null, "child-mmu-request", null);
  memSrv.minimizeMemoryUsage(aCallback);
}

init();


exports.reporter = reporter;

exports.minimizeMemory = minimizeMemory;
