/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Cc, Ci, Cu } = require("chrome");
const { EventEmitter } = require("sdk/deprecated/events");
const prefs = require("sdk/preferences/service");
const self = require("self");
const timer = require("sdk/timers");
const unload = require("sdk/system/unload");

const config = require("./config");

Cu.import('resource://gre/modules/Services.jsm');

var memSrv = Cc["@mozilla.org/memory-reporter-manager;1"]
             .getService(Ci.nsIMemoryReporterManager);


const reporter = EventEmitter.compose({
  constructor: function Reporter() {
    // Report unhandled errors from listeners
    this.on("error", console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');

    // TODO: Reading the pref should be moved out of this module
    this.interval = prefs.get(config.preferences.memory_poll_interval,
                              config.extension.memory_poll_interval_default);
    this._timer = timer.setInterval(function (aScope) { aScope.retrieveStatistics() },
                                    this.interval, this);
  },

  unload: function Reporter_unload() {
    this._removeAllListeners();
    timer.clearInterval(this._timer);
  },

  /**
   * Retrieve memory statistics
   */
  retrieveStatistics: function Reporter_retrieveStatistics() {
    var data = {
      timestamp:  Date.now(),
      //explicit: memSrv.explicit,
      resident: memSrv.resident
    }

    this._emit(config.application.topic_memory_statistics, data);
  }

})();


/**
 * For maximum effect, this returns to the event loop between each
 * notification.  See bug 610166 comment 12 for an explanation.
 * Ideally a single notification would be enough.
 *
 * Code borrowed from:
 *   http://mxr.mozilla.org/mozilla-central/ident?i=minimizeMemoryUsage3x
 */
var minimizeMemory = function (aCallback) {
  let i = 0;

  function runSoon(aCallback) {
    Services.tm.mainThread.dispatch({ run: aCallback },
                                    Ci.nsIThread.DISPATCH_NORMAL);
  }

  function sendHeapMinNotificationsInner() {
    Services.obs.notifyObservers(null, "memory-pressure", "heap-minimize");

    if (++i < 3) {
      runSoon(sendHeapMinNotificationsInner);
    }
    else if (aCallback) {
      runSoon(aCallback);
    }
  }

  sendHeapMinNotificationsInner();
}


exports.reporter = reporter;

exports.minimizeMemory = minimizeMemory;
