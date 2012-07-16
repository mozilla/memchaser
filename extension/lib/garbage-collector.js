/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// We have to declare it ourselves because the SDK doesn't export it correctly
const Cu = Components.utils;


Cu.import('resource://gre/modules/Services.jsm');


const {Cc, Ci} = require("chrome");
const { EventEmitter } = require("api-utils/events");
const prefs = require("api-utils/preferences-service");
const unload = require("api-utils/unload");

const config = require("config");


const reporter = EventEmitter.compose({
  constructor: function Reporter() {
    // Report unhandled errors from listeners
    this.on("error", console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');

    if (config.application.branch >= 16) {
      // The notify preference has to be enabled to be able to parse
      // the GC / CC information from the notifications
      this._isEnabled = prefs.get(config.preferences.memory_notify);
    }
    else {
      // The logger preference has to be enabled to be able to parse
      // the GC / CC information from the console service messages
      this._isEnabled = prefs.get(config.preferences.memory_log);
    }
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
    var memory_pref;
    if (config.application.branch >= 16) {
      memory_pref = config.preferences.memory_notify;
    }
    else {
      memory_pref = config.preferences.memory_log;
    }

    var modifiedPrefs = JSON.parse(prefs.get(config.preferences.modified_prefs,
                                             "{}"));
    if (!modifiedPrefs.hasOwnProperty(memory_pref)) {
      modifiedPrefs[memory_pref] = prefs.get(memory_pref);
    }

    prefs.set(memory_pref, true);
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
