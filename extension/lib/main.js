/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var {Cc, Ci} = require("chrome");

const events = require("events");
const widgets = require("widget");

const data = require("self").data;

const garbage_collector = require("garbage-collector");
const memory_reporter = require("memory-reporter");

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


exports.main = function(options, callbacks) {

  var widget = widgets.Widget({
    id: "memchaser-widget",
    label: "MemChaser",
    contentURL: [data.url("widget/widget.html")],
    contentScriptFile: [data.url("widget/widget.js")],
    contentScriptWhen: "ready",
    width: 400
  });

  // If new data from garbage collector is available update global data
  garbage_collector.on("data", function (data) {
    for (var entry in data) {
      if (entry in gData.current.garbage_collector) {
        gData.previous.garbage_collector[entry] = gData.current.garbage_collector[entry];
      }
      gData.current.garbage_collector[entry] = data[entry];

      if ("timestamp" in gData.previous.garbage_collector[entry] && "timestamp" in gData.current.garbage_collector[entry]) {
        var age = gData.current.garbage_collector[entry].timestamp.getTime() - gData.previous.garbage_collector[entry].timestamp.getTime();
        data[entry].age = age / 1000;
      }
    }

    widget.port.emit("update_garbage_collector", data);
  });

  // If new data for memory usage is available update global data
  memory_reporter.on("data", function (data) {
    gData.current.memory = data;
    widget.port.emit("update_memory", data);
  });
};
