/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Cc, Ci, Cu } = require("chrome");
const { EventEmitter } = require("sdk/deprecated/events");
const prefs = require("sdk/preferences/service");
const unload = require("sdk/system/unload");
const timers = require("sdk/timers");

const config = require("./config");

Cu.import('resource://gre/modules/Services.jsm');

const reporter = EventEmitter.compose({
  _pref_gc_notifications: null,

  constructor: function Reporter() {
    // Report unhandled errors from listeners
    this.on("error", console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');

    if (config.application.branch >= 16) {
      this._pref_gc_notifications = config.preferences.memory_notify;
    }
    else {
      this._pref_gc_notifications = config.preferences.memory_log;
    }

    // Ensure GC/CC observer and console messages preference is enabled
    this._isEnabled = prefs.get(this._pref_gc_notifications);
    if (!this._isEnabled)
      this._enable();

    Services.obs.addObserver(this, config.application.topic_cc_statistics, false);
    Services.obs.addObserver(this, config.application.topic_gc_statistics, false);
  },

  get pref_gc_notifications() {
    return this._pref_gc_notifications;
  },

  unload: function Reporter_unload() {
    this._removeAllListeners();

    Services.obs.removeObserver(this, config.application.topic_cc_statistics, false);
    Services.obs.removeObserver(this, config.application.topic_gc_statistics, false);
  },

  _enable: function Reporter__enable() {
    var modifiedPrefs = JSON.parse(prefs.get(config.preferences.modified_prefs,
                                             "{}"));
    if (!modifiedPrefs.hasOwnProperty(this._pref_gc_notifications)) {
      modifiedPrefs[this._pref_gc_notifications] = prefs.get(this._pref_gc_notifications);
    }

    prefs.set(this._pref_gc_notifications, true);
    prefs.set(config.preferences.modified_prefs, JSON.stringify(modifiedPrefs));
    this._isEnabled = true;
  },

  /**
   * Callback for GC/CC related observer notifications
   */
  observe: function Reporter_observe(aSubject, aTopic, aData) {
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

    // Once the console listener can be removed, we can emit directly
    timers.setTimeout(function (aScope) {
      aScope._emit(type, data);
    }, 0, this);
  }
})();


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


exports.reporter = reporter;

exports.doCC = doCC;
exports.doGlobalGC = doGlobalGC;
