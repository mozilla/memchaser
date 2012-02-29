const BYTE_TO_MEGABYTE = 1/1048576;

const GARBAGE_COLLECTOR_DURATION_WARNING = 100;

var logger = document.getElementById("logger");

function hide_init() {
  document.getElementById("init").style.display = "none";
  document.getElementById("data").style.display = "inline";
}

self.port.on("update_garbage_collector", function(data) {
  hide_init();

  // Update widget with current garbage collector activity
  ["gc", "cc"].forEach(function (aType) {
    // Keep old values displayed
    if (!data[aType])
      return;

    // If MaxPause is reported we have an incremental GC
    if (aType === "gc") {
      var label = document.getElementById("gc_label");
      label.textContent = ("MaxPause" in data[aType]) ? "iGC: " : "GC: ";
    }

    var duration = document.getElementById(aType + "_duration");
    duration.textContent = data[aType].duration + "ms";

    duration.className = (data[aType].duration >= GARBAGE_COLLECTOR_DURATION_WARNING) ?
                          "warning" : "";

    if (data[aType].age) {
      var age = document.getElementById(aType + "_age");
      age.textContent = " (" + data[aType].age + "s)";
    }
  });
});

self.port.on("update_memory", function(data) {
  hide_init();

  // Update widget with current memory usage
  ["resident"].forEach(function (aType) {
    if (data[aType]) {
      var element = document.getElementById(aType);
      element.textContent = Math.round(data[aType] * BYTE_TO_MEGABYTE) + "MB";
    }
  });
});

logger.onclick = function toggle() {
  logger.className = (logger.className === "enabled") ? "disabled" : "enabled";
  self.port.emit("logging_changed");
};

logger.onmouseover = function update_tooltip() {
  self.port.emit("update_tooltip", logger.id);
};

logger.onmouseout = function update_tooltip() {
  self.port.emit("update_tooltip");
};
