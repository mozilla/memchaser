/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Cc, Ci, Cu, CC } = require("chrome");
const { Frame } = require("sdk/ui/frame");
const panel = require("sdk/panel");
const prefs = require("sdk/preferences/service");
const self = require("sdk/self");
const simple_prefs = require("sdk/simple-prefs");
const tabs = require("sdk/tabs");
const { ToggleButton } = require('sdk/ui/button/toggle');
const { Toolbar } = require("sdk/ui/toolbar");

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
    height: 112,
    contentURL: self.data.url("panel/context.html"),
    contentScriptFile: [self.data.url("panel/context.js")],
    contentScriptWhen: "ready",
    onHide: handleContextPanelHide
  });

  contextPanel.on("message", function (aMessage) {
    let { type, data } = aMessage;
    switch (type) {
      // If user clicks a panel entry the appropriate command has to be executed
      case "command": 
        contextPanel.hide();

        switch (data) {
          case "help":
            tabs.open(config.extension.help_page_url);
            break;
          // Show the memchaser directory.
          case "log_folder":
            let nsLocalFile = CC("@mozilla.org/file/local;1",
                                "nsILocalFile", "initWithPath");
            new nsLocalFile(logger.dir.path).reveal();
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

  var frame = new Frame({
    url: "./frame/frame.html"
  });

  var menuButton = ToggleButton({
    id: "toolbar-menu-button",
    label: config.extension.ui_tooltips.tools_menu,
    icon: "./images/menu_button.svg",
    onChange: handleMenuButtonChange
  });

  var logButton = ToggleButton({
    id: "toolbar-log-button",
    label: config.extension.ui_tooltips.logger_disabled,
    icon: "./images/logging_disabled.svg",
    onChange: handleLogButtonChange
  });

  var toolbar = Toolbar({
    name: "memchaser-toolbar",
    title: "MemChaser",
    items: [frame, menuButton, logButton]
  });

  function handleMenuButtonChange(state) {
    if (state.checked) {
      contextPanel.show({ position: menuButton });
    }
  }

  function handleContextPanelHide() {
    menuButton.state('window', {checked: false});
  }

  function handleLogButtonChange(state) {
    logger.active = state.checked;
    var stateLabel = logger.active ? "enabled" : "disabled";
    logButton.label = config.extension.ui_tooltips["logger_" + stateLabel];
    logButton.icon = "./images/logging_" + stateLabel + ".svg";
  }

  function memoryStatisticsForwarder(aData) {
    if (gData.current.memory)
      gData.previous.memory = gData.current.memory;
    gData.current.memory = aData;

    frame.postMessage({ type: "update_memory", data: aData }, frame.url);

    // Memory statistics aren't pretty useful yet to be logged
    // See: https://github.com/mozilla/memchaser/issues/106
    //logger.log(config.application.topic_memory_statistics, aData);
  }

  memory.reporter.on(config.application.topic_memory_statistics, memoryStatisticsForwarder);

  function gcStatisticsForwarder(aData) {
    if (gData.current.gc)
      gData.previous.gc = gData.current.gc;
    gData.current.gc = aData;

    frame.postMessage({ type: "update_garbage_collector", data: gData }, frame.url);
    logger.log(config.application.topic_gc_statistics, aData);
  }

  garbage_collector.reporter.on(config.application.topic_gc_statistics, gcStatisticsForwarder);

  function ccStatisticsForwarder(aData) {
    if (gData.current.cc)
      gData.previous.cc = gData.current.cc;
    gData.current.cc = aData;

    frame.postMessage({ type: "update_cycle_collector", data: gData }, frame.url);
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
