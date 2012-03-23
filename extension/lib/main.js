/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var { Cc, Ci } = require("chrome");

var events = require("events");
var prefs = require("api-utils/preferences-service");
var self = require("self");
var widgets = require("widget");

var config = require("config");
var garbage_collector = require("garbage-collector");
var { Logger } = require("logger");
var memory_reporter = require("memory-reporter");


var gData = {
  current: {},
  previous: {}
};


exports.main = function (options, callbacks) {

  // Create logger instance
  var dir = Cc["@mozilla.org/file/directory_service;1"]
            .getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
  dir.append(self.name);
  var logger = new Logger({ dir: dir });

  var widget = widgets.Widget({
    id: "memchaser-widget",
    label: "MemChaser",
    tooltip: "MemChaser",
    contentURL: [self.data.url("widget/widget.html")],
    contentScriptFile: [self.data.url("widget/widget.js")],
    contentScriptWhen: "ready",
    width: 360
  });

  // If logger is clicked, then the state must be changed
  widget.port.on("logger_click", function () {
    if (logger.active) {
      logger.stop();
    } else {
      logger.start();
    }

    widget.port.emit("logger_update", { "active": logger.active });
  });

  // If user hovers over an entry the tooltip has to be updated
  widget.port.on("update_tooltip", function (data) {
    if (data === "logger" && logger.active) {
      data = "logger_enabled";
    }
    else if (data === "logger") {
      data = "logger_disabled";
    }

    widget.tooltip = config.extension.widget_tooltips[data];
  });

  memory_reporter.on(config.application.topic_memory_statistics, function (aData) {
    if (gData.current.memory)
      gData.previous.memory = gData.current.memory;
    gData.current.memory = aData;

    widget.port.emit('update_memory', aData);
    logger.log(config.application.topic_memory_statistics, aData);
  });

  garbage_collector.on(config.application.topic_gc_statistics, function (aData) {
    if (gData.current.gc)
      gData.previous.gc = gData.current.gc;
    gData.current.gc = aData;

    widget.port.emit('update_garbage_collector', gData);
    logger.log(config.application.topic_gc_statistics, aData);
  });

  garbage_collector.on(config.application.topic_cc_statistics, function (aData) {
    if (gData.current.cc)
      gData.previous.cc = gData.current.cc;
    gData.current.cc = aData;

    widget.port.emit('update_cycle_collector', gData);
    logger.log(config.application.topic_cc_statistics, aData);
  });
}


exports.onUnload = function (reason) {

  // Reset any modified preferences
  if (reason === "disable" || reason === "uninstall") {
    var modifiedPrefs = JSON.parse(prefs.get(config.preferences.modified_prefs, "{}"));
    for (var pref in modifiedPrefs) {
      prefs.set(pref, modifiedPrefs[pref]);
    }
    prefs.reset(config.preferences.modified_prefs);
  }
}
