/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {Cc, Ci} = require("chrome");
const { EventEmitter } = require("api-utils/events");
const prefs = require("api-utils/preferences-service");
const unload = require("api-utils/unload");

const config = require("config");

Components.utils.import('resource://gre/modules/Services.jsm');


const reporter = EventEmitter.compose({
  constructor: function Reporter() {
    // Report unhandled errors from listeners
    this.on("error", console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');

    // For now the logger preference has to be enabled to be able to
    // parse the GC / CC information from the console service messages
    this._isEnabled = prefs.get(config.preferences.memory_log);
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
      case 13:
        this._collector_data = config.extension.gc_app_data["13"];
        break;
      default:
        this._collector_data = config.extension.gc_app_data["14"];
    }

    Services.console.registerListener(this);
  },

  unload: function Reporter_unload() {
    this._removeAllListeners();

    if (this._isEnabled)
      Services.console.unregisterListener(this);
  },

  _enable: function() {
    let logging_pref= config.preferences.memory_log;

    var modifiedPrefs = JSON.parse(prefs.get(config.preferences.modified_prefs,
                                             "{}"));
    if (!modifiedPrefs.hasOwnProperty(logging_pref)) {
      modifiedPrefs[logging_pref] = prefs.get(logging_pref);
    }

    prefs.set(logging_pref, true);
    prefs.set(config.preferences.modified_prefs, JSON.stringify(modifiedPrefs));
    this._isEnabled = true;
  },

  /**
   * Until we have an available API to retrieve GC related information we have to
   * parse the console messages in the Error Console
   **/
  observe: function Reporter_observe(aMessage) {
    var msg = aMessage.message;

    var sections = /^(CC|GC)/i.exec(msg);
    if (sections === null)
      return;

    var data = this.parseConsoleMessage(sections[1].toLowerCase(), msg);

    let self = this;
    require("timer").setTimeout(function () {
      self._emit("data", data);
    });
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

    var data = { };
    data[aType] = {
      timestamp : new Date()
    };

    this._collector_data[aType].forEach(function (aEntry) {
      data[aType][aEntry.label] = getValueFor(aEntry.label, aEntry.regex)
    });

    return data;
  }
})();


exports.on = reporter.on;
exports.removeListener = reporter.removeListener;
