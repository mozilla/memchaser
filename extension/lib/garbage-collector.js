/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Cc, Ci, Cu } = require("chrome");
const { EventEmitter } = require("api-utils/events");
const prefs = require("api-utils/preferences-service");
const unload = require("api-utils/unload");

const config = require("config");

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

    // When we have to parse console messages find the right data
    switch (config.application.branch) {
      case 10:
        this._collector_data = config.extension.gc_app_data["10"];
        break;
      case 11:
      case 12:
        this._collector_data = config.extension.gc_app_data["11"];
        break;
      default:
        this._collector_data = config.extension.gc_app_data["13"];
    }

    if (config.application.branch >= 14) {
      Services.obs.addObserver(this, config.application.topic_cc_statistics, false);
      Services.obs.addObserver(this, config.application.topic_gc_statistics, false);
    }
    else {
      Services.console.registerListener(this);
    }
  },

  get pref_gc_notifications() {
    return this._pref_gc_notifications;
  },

  unload: function Reporter_unload() {
    this._removeAllListeners();

    if (config.application.branch >= 14) {
      Services.obs.removeObserver(this, config.application.topic_cc_statistics, false);
      Services.obs.removeObserver(this, config.application.topic_gc_statistics, false);
    } else {
      Services.console.unregisterListener(this);
    }
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

    if (config.application.branch >= 14) {
      data = JSON.parse(aData);

      // Use milliseconds instead of microseconds for the timestamp
      if ('timestamp' in data) {
        data['timestamp'] = Math.round(data['timestamp'] / 1000);
      }
    }
    else {
      // If it's not a GC/CC message return immediately
      var sections = /^(CC|GC)/i.exec(aSubject.message);
      if (sections === null)
        return;

      type = (sections[1].toLowerCase() === "cc") ? config.application.topic_cc_statistics
                                                  : config.application.topic_gc_statistics;
      data = this.parseConsoleMessage(sections[1].toLowerCase(), aSubject.message);
    }

    // Once the console listener can be removed, we can emit directly
    require("timer").setTimeout(function (aScope) {
      aScope._emit(type, data);
    }, 0, this);
  },

  /**
   * Parse the console message for all wanted entries
   */
  parseConsoleMessage : function Reporter_parseConsoleMessage(aType, aMessage) {
    /**
     * Inline function to retrieve the value for a given key
     */
    function getValueFor(aKey, aRegex) {
      var regexp = new RegExp(aKey + ":" + aRegex, "i");
      var matches = regexp.exec(aMessage);

      return matches ? matches[1] : undefined;
    }

    let data = {
      timestamp: Date.now()
    };

    this._collector_data[aType].forEach(function (aEntry) {
      data[aEntry.label] = getValueFor(aEntry.label, aEntry.regex)
    });

    return data;
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
