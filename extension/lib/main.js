/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var { Cc, Ci } = require("chrome");

var events = require("events");
var prefs = require("api-utils/preferences-service");
var self = require("self");
var widgets = require("widget");

var garbage_collector = require("garbage-collector");
var { Logger } = require("logger");
var memory_reporter = require("memory-reporter");


var gData = {
  current: {
    memory: { },
    garbage_collector: { }
  },
  previous: {
    memory: { },
    garbage_collector: { }
  }
};

const MODIFIED_PREFS_PREF = "extensions." + self.id + ".modifiedPrefs";


exports.main = function (options, callbacks) {

  // Create logger instance
  var dir = Cc["@mozilla.org/file/directory_service;1"]
            .getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
  dir.append(self.name);
  var logger = new Logger(dir);

  var widget = widgets.Widget({
    id: "memchaser-widget",
    label: "MemChaser",
    contentURL: [self.data.url("widget/widget.html")],
    contentScriptFile: [self.data.url("widget/widget.js")],
    contentScriptWhen: "ready",
    width: 400
  });

  var loggerWidget = widgets.Widget({
    id: "memchaser-logger-widget",
    label: "MemChaser logging",
    tooltip: "MemChaser logging is disabled. Click to enable.",
    contentURL: [self.data.url("widget/loggerWidget.html")],
    contentScriptFile: [self.data.url("widget/loggerWidget.js")],
    contentScriptWhen: "ready",
    width: 16,
    onClick: function() {
      if (logger.active) {
        logger.stop();
        this.tooltip = "MemChaser logging is disabled. Click to enable.";
      } else {
        logger.start();
        this.tooltip = "MemChaser logging is enabled. Click to disable.";
      }
      this.port.emit("logging_changed", logger.active);
    }
  });

  // If new data from garbage collector is available update global data
  garbage_collector.on("data", function (data) {
    for (var entry in data) {
      if (entry in gData.current.garbage_collector) {
        gData.previous.garbage_collector[entry] = gData.current.garbage_collector[entry];
      }
      gData.current.garbage_collector[entry] = data[entry];

      if (entry in gData.previous.garbage_collector) {
        var currentTime = gData.current.garbage_collector[entry].timestamp.getTime();
        var previousTime = gData.previous.garbage_collector[entry].timestamp.getTime();
        var age = (currentTime - previousTime) - gData.current.garbage_collector[entry].duration;
        data[entry].age = (age * 0.001).toFixed(1);
      }
    }

    widget.port.emit("update_garbage_collector", data);
    logger.log(gData.current);
  });

  // If new data for memory usage is available update global data
  memory_reporter.on("data", function (data) {
    gData.current.memory = data;
    widget.port.emit("update_memory", data);
    logger.log(gData.current);
  });
};

exports.onUnload = function (reason) {

  // Reset any modified preferences
  if (reason === "disable" || reason === "uninstall") {
    var modifiedPrefs = JSON.parse(prefs.get(MODIFIED_PREFS_PREF, "{}"));
    for (var pref in modifiedPrefs) {
      prefs.set(pref, modifiedPrefs[pref]);
    }
    prefs.reset(MODIFIED_PREFS_PREF);
  }
};
