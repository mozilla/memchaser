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

const PREF_MEM_LOGGER = "javascript.options.mem.log";
const PREF_MODIFIED_PREFS = "extensions." + require("self").id + ".modifiedPrefs";


const reporter = EventEmitter.compose({
  constructor: function Reporter() {
    // Report unhandled errors from listeners
    this.on("error", console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');

    // For now the logger preference has to be enabled to be able to
    // parse the GC / CC information from the console service messages
    this._isEnabled = prefs.get(PREF_MEM_LOGGER);
    if (!this._isEnabled)
      this._enable();

    // When we have to parse console messages find the right data
    switch (config.APP_BRANCH) {
      case 10:
        this._collector_data = config.GARBAGE_COLLECTOR_DATA["10"];
        break;
      case 11:
      case 12:
        this._collector_data = config.GARBAGE_COLLECTOR_DATA["11"];
        break;
      case 13:
        this._collector_data = config.GARBAGE_COLLECTOR_DATA["13"];
        break;
      default:
        this._collector_data = config.GARBAGE_COLLECTOR_DATA["14"];
    }

    if (config.APP_BRANCH < 14) {
      Services.console.registerListener(this);
    } else {
      Services.obs.addObserver(this, "garbage-collection-statistics", false);
      Services.obs.addObserver(this, "cycle-collection-statistics", false);
    }
  },

  unload: function Reporter_unload() {
    this._removeAllListeners();

    if (this._isEnabled) {
      if (config.APP_BRANCH < 14) {
        Services.console.unregisterListener(this);
      } else {
        Services.obs.removeObserver(this, "garbage-collection-statistics");
        Services.obs.removeObserver(this, "cycle-collection-statistics");
      }
    }
  },

  _enable: function() {
    var modifiedPrefs = JSON.parse(prefs.get(PREF_MODIFIED_PREFS, "{}"));
    if (!modifiedPrefs.hasOwnProperty(PREF_MEM_LOGGER)) {
      modifiedPrefs[PREF_MEM_LOGGER] = prefs.get(PREF_MEM_LOGGER);
    }
    prefs.set(PREF_MEM_LOGGER, true);
    prefs.set(PREF_MODIFIED_PREFS, JSON.stringify(modifiedPrefs));
    this._isEnabled = true;
  },

  observe: function(subject, topic, json) {
    if (config.APP_BRANCH < 14) {
      var msg = subject.message;

      var sections = /^(CC|GC)/i.exec(msg);
      if (sections === null)
        return;

      var data = this.parseConsoleMessage(sections[1].toLowerCase(), msg);

      let self = this;
      require("timer").setTimeout(function () {
        self._emit("data", data);
      });
      return;
    }

    var data = JSON.parse(json);
    var output = {};
    if (topic == "garbage-collection-statistics")
      output.gc = { timestamp: new Date(), duration: ''+data['max_pause'] };
    else
      output.cc = { timestamp: new Date(), duration: ''+data['duration'] };
    this._emit('data', output);
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
