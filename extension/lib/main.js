/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Cc, Ci, Cu, CC } = require("chrome");
const events = require("sdk/deprecated/events");
const panel = require("sdk/panel");
const prefs = require("sdk/preferences/service");
const self = require("sdk/self");
const simple_prefs = require("sdk/simple-prefs");
const widgets = require("sdk/widget");

const config = require("./config");
const garbage_collector = require("./garbage-collector");
const { Logger } = require("./logger");
var memory = require("./memory");

Cu.import('resource://gre/modules/Services.jsm');

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
  var logger = new Logger({ dir: dir });

  var contextPanel = panel.Panel({
    width: 128,
    height: 107,
    contentURL: self.data.url("panel/context.html"),
    contentScriptFile: [self.data.url("panel/context.js")],
    contentScriptWhen: "ready"
  });

  contextPanel.on("message", function (aMessage) {
    let { type, data } = aMessage;
    switch (type) {
      // If user clicks a panel entry the appropriate command has to be executed
      case "command": 
        contextPanel.hide();

        switch (data) {
          // Show the memchaser directory.
          case "log_folder":
            let nsLocalFile = CC("@mozilla.org/file/local;1",
                                "nsILocalFile", "initWithPath");
            new nsLocalFile(logger.dir.path).reveal();
            break;
          case "logger_status":
            logger.active = !logger.active;
            widget.postMessage({ type: "update_logger", data: { "active": logger.active } });
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
        break;
    }
  });

  var widget = widgets.Widget({
    id: "memchaser-widget",
    label: "MemChaser",
    tooltip: "MemChaser",
    contentURL: self.data.url("widget/widget.html"),
    contentScriptFile: [self.data.url("widget/widget.js")],
    contentScriptWhen: "ready",
    panel: contextPanel,
    width: 360,
    onClick: function () {
      contextPanel.postMessage({ type: "update", data: { logger_active: logger.active }});
    }
  });


  widget.on("message", function (aMessage) {
    let { type, data } = aMessage;
    switch (type) {
      // If user hovers over an entry the tooltip has to be updated
      case "update_tooltip":
        if (data === "logger" && logger.active) {
          data = "logger_enabled";
        }
        else if (data === "logger") {
          data = "logger_disabled";
        }

        widget.tooltip = config.extension.widget_tooltips[data];
        break;
    }
  });

  function memoryStatisticsForwarder(aData) {
    if (gData.current.memory)
      gData.previous.memory = gData.current.memory;
    gData.current.memory = aData;

    widget.postMessage({ type: "update_memory", data: aData });

    // Memory statistics aren't pretty useful yet to be logged
    // See: https://github.com/mozilla/memchaser/issues/106
    //logger.log(config.application.topic_memory_statistics, aData);
  }

  memory.reporter.on(config.application.topic_memory_statistics, memoryStatisticsForwarder);

  function gcStatisticsForwarder(aData) {
    if (gData.current.gc)
      gData.previous.gc = gData.current.gc;
    gData.current.gc = aData;

    widget.postMessage({ type: "update_garbage_collector", data: gData });
    logger.log(config.application.topic_gc_statistics, aData);
  }

  garbage_collector.reporter.on(config.application.topic_gc_statistics, gcStatisticsForwarder);

  function ccStatisticsForwarder(aData) {
    if (gData.current.cc)
      gData.previous.cc = gData.current.cc;
    gData.current.cc = aData;

    widget.postMessage({ type: "update_cycle_collector", data: gData });
    logger.log(config.application.topic_cc_statistics, aData);
  }

  garbage_collector.reporter.on(config.application.topic_cc_statistics, ccStatisticsForwarder);

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
