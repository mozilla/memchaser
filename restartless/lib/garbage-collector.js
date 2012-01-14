/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Components.utils.import('resource://gre/modules/Services.jsm');


const {Cc,Ci} = require("chrome");

const { EventEmitter } = require("api-utils/events");
const prefs = require("api-utils/preferences-service");
const unload = require("api-utils/unload");


const MEM_LOGGER_PREF = "javascript.options.mem.log";


const reporter = EventEmitter.compose({
  constructor: function Reporter() {
    // Report unhandled errors from listeners
    this.on("error", console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');

    // For now the logger preference has to be enabled to be able to
    // parse the GC / CC information from the console service messages
    this._isEnabled = prefs.get(MEM_LOGGER_PREF);
    if (!this._isEnabled) {
      prefs.set(MEM_LOGGER_PREF, true);

      var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                    .getService(Ci.nsIPromptService);
      var msg = "In being able to show Garbage Collector information, Firefox has to be restarted.";

      if (prompts.confirm(null, "MemChaser - Restart Request", msg)) {
        var startup = Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup);
        startup.quit(Ci.nsIAppStartup.eRestart | Ci.nsIAppStartup.eAttemptQuit);
      }
    }

    Services.console.registerListener(this);
  },

  unload: function Reporter_unload() {
    this._removeAllListeners();

    if (this._isEnabled)
      Services.console.unregisterListener(this);
  },

  get isEnabled() this._isEnabled,

  observe: function(aMessage) {
    var msg = aMessage.message;

    // Only process messages from the garbage collector
    if (! msg.match(/^(CC|GC).*/i))
      return;

    // Parse GC/CC duration from the message
    /^(CC|GC).*(duration: ([\d\.]+)|Total:([\d\.]+))/i.exec(msg);

    var data = { };
    data[RegExp.$1.toLowerCase()] = (RegExp.$4) ? RegExp.$4 : RegExp.$3;

    this._emit('data', data);
  }
})();

exports.isEnabled = reporter.isEnabled;
exports.on = reporter.on;
exports.removeListener = reporter.removeListener;
