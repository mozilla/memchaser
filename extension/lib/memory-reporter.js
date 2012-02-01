/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var {Cc, Ci} = require("chrome");

const { EventEmitter } = require("api-utils/events");
const prefs = require("api-utils/preferences-service");
const self = require("self");
const timer = require("api-utils/timer");
const unload = require("api-utils/unload");

const POLL_INTERVAL_PREF = "extensions." + self.id + ".memory.interval";
const POLL_INTERVAL_DEFAULT = 5000;


var memSrv = Cc["@mozilla.org/memory-reporter-manager;1"]
             .getService(Ci.nsIMemoryReporterManager);


const reporter = EventEmitter.compose({
  constructor: function Reporter() {
    // Report unhandled errors from listeners
    this.on("error", console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');

    // TODO: Reading the pref should be moved out of this module
    this.interval = prefs.get(POLL_INTERVAL_PREF, POLL_INTERVAL_DEFAULT);
    this._timer = timer.setInterval(this.onTimer, this.interval, this);
  },

  unload: function Reporter_unload() {
    this._removeAllListeners();
    timer.clearInterval(this._timer);
  },

  onTimer: function Reporter_onTimer(scope) {
    var data = {
      //explicit: memSrv.explicit,
      resident: memSrv.resident
    }

    scope._emit('data', data);
  }
})();

exports.on = reporter.on;
exports.removeListener = reporter.removeListener;
