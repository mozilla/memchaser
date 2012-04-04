/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// We have to declare it ourselves because the SDK doens't export it correctly
const Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

const { Cc, Ci } = require("chrome");
const events = require("events");
const prefs = require("api-utils/preferences-service");
const self = require("self");
const simple_prefs = require("simple-prefs");
const widgets = require("widget");

const config = require("config");
const garbage_collector = require("garbage-collector");
const { Logger } = require("logger");
var memory = require("memory");

var gData = {
  current: {},
  previous: {}
};


exports.main = function (options, callbacks) {

  // Get the file directory from the prefs,
  // and fallback on the profile directory if not specified
  var dir = prefs.get(config.preferences.log_directory, "");

  if (!dir) {
    dir = Services.dirsvc.get("ProfD", Ci.nsILocalFile);
    dir.append(self.name);

    prefs.set(config.preferences.log_directory, dir.path);
  }

  // Create logger instance
  var dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
  dir.append(self.name);
  var logger = new Logger({ dir: dir });

  var contextPanel = require("panel").Panel({
    width: 128,
    height: 107,
    contentURL: [self.data.url("panel/context.html")],
    contentScriptFile: [self.data.url("panel/context.js")],
    contentScriptWhen: "ready"
  });

  // If user clicks a panel entry the appropriate command has to be executed
  contextPanel.port.on("command", function (data) {
    contextPanel.hide();

    switch (data.type) {
      case "log_folder":
        // Show the memchaser directory.
        let nsLocalFile = Components.Constructor("@mozilla.org/file/local;1",
                                                 "nsILocalFile", "initWithPath");
        new nsLocalFile(logger.dir.path).reveal();
        break;
      case "logger_status":
        logger.active = !logger.active;
        widget.port.emit("update_logger", { "active": logger.active });
        break;
      case "minimize_memory":
        memory.minimizeMemory(memory.reporter.retrieveStatistics);
        break;
      case "trigger_cc":
        garbage_collector.doCC();
        memory.reporter.retrieveStatistics();
        break;
      case "trigger_gc":
        garbage_collector.doGlobalGC();
        memory.reporter.retrieveStatistics();
        break;
    }
  });

  var widget = widgets.Widget({
    id: "memchaser-widget",
    label: "MemChaser",
    tooltip: "MemChaser",
    contentURL: [self.data.url("widget/widget.html")],
    contentScriptFile: [self.data.url("widget/widget.js")],
    contentScriptWhen: "ready",
    panel: contextPanel,
    width: 360,
    onClick: function () {
      contextPanel.port.emit("update", { logger_active: logger.active });
    }
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

  memory.reporter.on(config.application.topic_memory_statistics, function (aData) {
    if (gData.current.memory)
      gData.previous.memory = gData.current.memory;
    gData.current.memory = aData;

    widget.port.emit('update_memory', aData);
    logger.log(config.application.topic_memory_statistics, aData);
  });

  garbage_collector.reporter.on(config.application.topic_gc_statistics, function (aData) {
    if (gData.current.gc)
      gData.previous.gc = gData.current.gc;
    gData.current.gc = aData;

    widget.port.emit('update_garbage_collector', gData);
    logger.log(config.application.topic_gc_statistics, aData);
  });

  garbage_collector.reporter.on(config.application.topic_cc_statistics, function (aData) {
    if (gData.current.cc)
      gData.previous.cc = gData.current.cc;
    gData.current.cc = aData;

    widget.port.emit('update_cycle_collector', gData);
    logger.log(config.application.topic_cc_statistics, aData);
  });

  simple_prefs.on('log.directory', function (aData) {
    logger.dir = prefs.get(config.preferences.log_directory);
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
