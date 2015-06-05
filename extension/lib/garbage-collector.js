/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Cc, Ci, Cu } = require("chrome");
const { emit, on, off } = require("sdk/event/core");
const prefs = require("sdk/preferences/service");
const timers = require("sdk/timers");
const unload = require("sdk/system/unload");

const config = require("./config");

const PREF_GC_NOTIFICATIONS = config.preferences.memory_notify;

Cu.import('resource://gre/modules/Services.jsm');

var _isEnabled;
var reporter = {
  name: "gcCcReporter",
  pref_gc_notifications: PREF_GC_NOTIFICATIONS
};

var CollectorObserver = {
  observe: function CollectorObserver_observe(aSubject, aTopic, aData) {
    let data = { };
    let type = aTopic;

    try {
      data = JSON.parse(aData);
    } catch (e) {
      Cu.reportError("Failure parsing JSON data: " + aData);
    }

    // Use milliseconds instead of microseconds for the timestamp
    if ('timestamp' in data)
      data['timestamp'] = Math.round(data['timestamp'] / 1000);

    emit(reporter, type, data);
  }
}

var _enable = function () {
  var modifiedPrefs = JSON.parse(prefs.get(config.preferences.modified_prefs,
                                            "{}"));
  if (!modifiedPrefs.hasOwnProperty(PREF_GC_NOTIFICATIONS)) {
    modifiedPrefs[PREF_GC_NOTIFICATIONS] = prefs.get(PREF_GC_NOTIFICATIONS);
  }

  prefs.set(PREF_GC_NOTIFICATIONS, true);
  prefs.set(config.preferences.modified_prefs, JSON.stringify(modifiedPrefs));
  _isEnabled = true;
}

var init = function () {
  // Ensure GC/CC observer and console messages preference is enabled
  _isEnabled = prefs.get(PREF_GC_NOTIFICATIONS);
  if (!_isEnabled)
    _enable();

  reporter.on = on.bind(null, reporter);
  reporter.off = off.bind(null, reporter);

  Services.obs.addObserver(CollectorObserver, config.application.topic_cc_statistics, false);
  Services.obs.addObserver(CollectorObserver, config.application.topic_gc_statistics, false);

  unload.when((reason) => {
      off(reporter);
      Services.obs.removeObserver(CollectorObserver, config.application.topic_cc_statistics, false);
      Services.obs.removeObserver(CollectorObserver, config.application.topic_gc_statistics, false);
  });

}

/**
 * Trigger a Cycle Collector run
 */
var doCC = function () {
  let activeWindow = Services.wm.getMostRecentWindow("navigator:browser");

  activeWindow.QueryInterface(Ci.nsIInterfaceRequestor)
              .getInterface(Ci.nsIDOMWindowUtils)
              .cycleCollect();
  Services.obs.notifyObservers(null, "child-cc-request", null);
}

/**
 * Trigger a global Garbage Collector run
 */
var doGlobalGC = function () {
  Cu.forceGC();
  Services.obs.notifyObservers(null, "child-gc-request", null);
}

init();


exports.reporter = reporter;

exports.doCC = doCC;
exports.doGlobalGC = doGlobalGC;
