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
const GC_INCREMENTAL_PREF = "javascript.options.mem.gc_incremental"


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

    // Determine whether incremental GC is supported in this binary
    this._igcSupported = prefs.get(GC_INCREMENTAL_PREF)
    if (typeof(this._igcSupported) === 'undefined')
      this._igcSupported = false;
    else
      this._igcSupported = true;

    Services.console.registerListener(this);
  },

  unload: function Reporter_unload() {
    this._removeAllListeners();

    if (this._isEnabled)
      Services.console.unregisterListener(this);
  },

  get igcSupported() this._igcSupported,

  igcEnabled: function(window) {
    if (!this.igcSupported)
      return false;

    var enabled = window.QueryInterface(Ci.nsIInterfaceRequestor)
                        .getInterface(Ci.nsIDOMWindowUtils)
                        .isIncrementalGCEnabled();
    return enabled;
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
   * Firefox 11 and 12
   * GC(T+0.0) Type:Glob, Total:27.9, Wait:0.6, Mark:13.4, Sweep:12.6, FinObj:3.7,
   *           FinStr:0.2, FinScr:0.5, FinShp:2.1, DisCod:0.3, DisAnl:3.0,
   *           XPCnct:0.8, Destry:0.0, End:2.1, +Chu:16, -Chu:0, Reason:DestC
   * CC(T+9.6) collected: 1821 (1821 waiting for GC), suspected: 18572,
   *           duration: 31 ms.
   *
   * Firefox >13
   * GC(T+0.0) TotalTime: 254.2ms, Type: global, MMU(20ms): 0%, MMU(50ms): 0%, 
   *              Reason: MAYBEGC, +chunks: 0, -chunks: 0 mark: 160.2, 
   *              mark-roots: 5.8, mark-other: 3.6, sweep: 92.0, sweep-obj: 7.9, 
   *              sweep-string: 12.2, sweep-script: 1.2, sweep-shape: 6.7, 
   *              discard-code: 6.8, discard-analysis: 46.4, xpconnect: 3.5, 
   *              deallocate: 0.4
   *
   * CC(T+0.0) collected: 76 (76 waiting for GC), suspected: 555, duration: 16 ms.
   *           ForgetSkippable 42 times before CC, min: 0 ms, max: 21 ms, 
   *           avg: 1 ms, total: 50 ms, removed: 7787
   **/
  observe: function(aMessage) {
    var msg = aMessage.message;

    // Only process messages from the garbage collector
    if (! msg.match(/^(CC|GC).*/i))
      return;

    // Parse GC/CC duration from the message
    var matches = /^(CC|GC).*(duration: ([\d\.]+)|Total:([\d\.]+)|TotalTime: ([\d\.]+))/i.exec(msg);
    var data = { }
      , key = matches[1].toLowerCase();
    data[key] = {
      timestamp: new Date(),
    }
    
    switch(true){
      case (matches[3] != null):
        data[key]["duration"] = matches[3];
        break;
      case (matches[4] != null):
        data[key]["duration"] = matches[4];
        break;
      case (matches[5] != null):
        data[key]["duration"] = matches[5];
        break;
    }

    let self = this;
    require("timer").setTimeout(function () {
      self._emit('data', data);
    });
  }
})();

exports.on = reporter.on;
exports.igcSupported = reporter.igcSupported;
exports.igcEnabled = reporter.igcEnabled;
exports.removeListener = reporter.removeListener;
