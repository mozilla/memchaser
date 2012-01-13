/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var {Cc, Ci} = require("chrome");

const { EventEmitter } = require("events");
const timers = require("timers");
const unload = require("unload");

const BYTE_TO_MEGABYTE = 1/1048576;

const POLL_INTERVAL_PREF = "extensions.memchaser.memory.interval";
const POLL_INTERVAL_DEFAULT = 5000;


var memSrv = Cc["@mozilla.org/memory-reporter-manager;1"]
             .getService(Ci.nsIMemoryReporterManager);


function Reporter() {
  unload.ensure(this);
}
Reporter.prototype = new EventEmitter();
Reporter.prototype.constructor = Reporter;

Reporter.prototype.unload() = function Reporter_unload() {
  console.log("unload");
  this._removeAllListeners();
}


const reporter = EventEmitter.compose({
  constructor: function Reporter() {
    // Report unhandled errors from listeners
    this.on("error", console.exception.bind(console));

    this.unload = this.unload.bind(this);
    unload.ensure(this);

    this._interval = POLL_INTERVAL_DEFAULT;
    this._timer = timers.setInterval(this._onTimer, this._interval);
  },

  unload: function _destructor() {
    this._removeAllListeners();
    timers.clearInterval(this._timer);
  },

  _onTimer: function() {
    this._emit('data', memSrv.explicit * BYTE_TO_MEGABYTE);
  },

  get interval() {
    return this._interval;
  }
})();

exports.on = reporter.on;
exports.removeListener = reporter.removeListener;

exports.Reporter = Reporter;