const events = require("events");
const widgets = require("widget");

const data = require("self").data;

exports.main = function(options, callbacks) {
  console.log(options.loadReason);

  var widget = widgets.Widget({
    id: "memchaser-widget",
    label: "MemChaser",
    content: "GC",
    width: 100
  });

  var reporter = require("memory-reporter").reporter;
  reporter.on('data', function (data) {
    widget.content = Math.round(data) + 'MB';
  });

  //reporter.interval = 1000;
  console.log(reporter._interval);
};
