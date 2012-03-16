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
var browser_window = require("window-utils").windowIterator().next();

const MODIFIED_PREFS_PREF = "extensions." + self.id + ".modifiedPrefs";


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


exports.main = function (options, callbacks) {

  // Create logger instance
  var dir = Cc["@mozilla.org/file/directory_service;1"]
            .getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
  dir.append(self.name);
  var logger = new Logger(dir);

  var widget = widgets.Widget({
    id: "memchaser-widget",
    label: "MemChaser",
    tooltip: "MemChaser",
    contentURL: [self.data.url("widget/widget.html")],
    contentScriptFile: [self.data.url("widget/widget.js")],
    contentScriptWhen: "ready",
    width: 360
  });

  // If new data from garbage collector is available update global data
  garbage_collector.on("data", function (data) {
    function getDuration(entry) {
      return entry.duration ||
             (entry.MaxPause || entry['Max Pause']) ||
             (entry.Total || entry.TotalTime || entry['Total Time']);
    }

    function isIncremental(entry) {
      return (entry["MaxPause"] || entry["Max Pause"]) ? true : false;
    }

    for (var entry in data) {
      // Backup previous entry if one exists
      if (entry in gData.current.garbage_collector) {
        gData.previous.garbage_collector[entry] = gData.current.garbage_collector[entry];
      }
      gData.current.garbage_collector[entry] = data[entry];

      var duration = getDuration(data[entry]);
      data[entry].duration = duration;
      if (entry === "gc") {
        data[entry].isIncremental = isIncremental(data[entry]);
      }

      if (entry in gData.previous.garbage_collector) {
        var currentTime = gData.current.garbage_collector[entry].timestamp.getTime();
        var previousTime = gData.previous.garbage_collector[entry].timestamp.getTime();
        var age = (currentTime - previousTime) - duration;
        data[entry].age = (age * 0.001).toFixed(1);
      }
    };

    widget.port.emit("update_garbage_collector", data);
    logger.log(gData.current);
  });

  // If new data for memory usage is available update global data
  memory_reporter.on("data", function (data) {
    gData.current.memory = data;
    widget.port.emit("update_memory", data);
    logger.log(gData.current);
  });

  // If logger is clicked, then the state must be changed
  widget.port.on("logging_changed", function () {
    if (logger.active) {
      logger.stop();
    } else {
      logger.start();
    }
  });

  widget.port.on("update_tooltip", function (data) {
    switch(data) {
      case "logger":
        if (logger.active) {
          widget.tooltip = "MemChaser logging is currently enabled. Click to disable.";
        } else {
          widget.tooltip = "MemChaser logging is currently disabled. Click to enable.";
        }
        break;
      default:
        widget.tooltip = "MemChaser";
    }
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
