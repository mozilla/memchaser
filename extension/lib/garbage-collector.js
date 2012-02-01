/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Components.utils.import('resource://gre/modules/Services.jsm');


const {Cc,Ci} = require("chrome");

const { EventEmitter } = require("api-utils/events");
const prefs = require("api-utils/preferences-service");
const self = require("self");
const unload = require("api-utils/unload");

const MEM_LOGGER_PREF = "javascript.options.mem.log";
const MODIFIED_PREFS_PREF = "extensions." + self.id + ".modifiedPrefs";


const reporter = EventEmitter.compose({
  constructor: function Reporter() {
    // Report unhandled errors from listeners
    this.on("error", console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');

    // For now the logger preference has to be enabled to be able to
    // parse the GC / CC information from the console service messages
    this._isEnabled = prefs.get(MEM_LOGGER_PREF);
    if (!this._isEnabled)
      this._enable();

    Services.console.registerListener(this);
  },

  unload: function Reporter_unload() {
    this._removeAllListeners();

    if (this._isEnabled)
      Services.console.unregisterListener(this);
  },

  _enable: function() {
    var modifiedPrefs = JSON.parse(prefs.get(MODIFIED_PREFS_PREF, "{}"));
    if (!modifiedPrefs.hasOwnProperty(MEM_LOGGER_PREF)) {
      modifiedPrefs[MEM_LOGGER_PREF] = prefs.get(MEM_LOGGER_PREF);
    }
    prefs.set(MEM_LOGGER_PREF, true);
    prefs.set(MODIFIED_PREFS_PREF, JSON.stringify(modifiedPrefs));
    this._isEnabled = true;
  },

  /**
   * Until we have an available API to retrieve GC related information we have to
   * parse the console messages in the Error Console
   *
   * Firefox <11
   * GC mode: full, timestamp: 1325854678521066, duration: 32 ms.
   * CC timestamp: 1325854683540071, collected: 75 (75 waiting for GC),
   *               suspected: 378, duration: 19 ms.
   *
   * Firefox >=11
   * GC(T+0.0) Type:Glob, Total:27.9, Wait:0.6, Mark:13.4, Sweep:12.6, FinObj:3.7,
   *           FinStr:0.2, FinScr:0.5, FinShp:2.1, DisCod:0.3, DisAnl:3.0,
   *           XPCnct:0.8, Destry:0.0, End:2.1, +Chu:16, -Chu:0, Reason:DestC
   * CC(T+9.6) collected: 1821 (1821 waiting for GC), suspected: 18572,
   *           duration: 31 ms.
   **/
  observe: function(aMessage) {
    var msg = aMessage.message;

    // Only process messages from the garbage collector
    if (! msg.match(/^(CC|GC).*/i))
      return;

    // Parse GC/CC duration from the message
    /^(CC|GC).*(duration: ([\d\.]+)|Total:([\d\.]+))/i.exec(msg);

    var data = { };
    data[RegExp.$1.toLowerCase()] = {
      timestamp: new Date(),
      duration: (RegExp.$4) ? RegExp.$4 : RegExp.$3
    }

    this._emit('data', data);
  }
})();

exports.on = reporter.on;
exports.removeListener = reporter.removeListener;
