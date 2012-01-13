const events = require("events");
const widgets = require("widget");

const data = require("self").data;
const memory_reporter = require("memory-reporter");

var gData = { };


exports.main = function(options, callbacks) {
  console.log(options.loadReason);

  var widget = widgets.Widget({
    id: "memchaser-widget",
    label: "MemChaser",
    contentURL: [data.url("widget/widget.html")],
    contentScriptFile: [data.url("widget/widget.js")],
    contentScriptWhen: "ready",
    width: 150
  });

  memory_reporter.on("data", function (data) {
    gData.memory = data;
    widget.postMessage(gData);
  });
};
