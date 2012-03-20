const BYTE_TO_MEGABYTE = 1/1048576;

const GARBAGE_COLLECTOR_DURATION_WARNING = 100;

var bindEvents = function () {
  let logger = document.getElementById("logger");
  let tooltipElements = [].slice.call(document.querySelectorAll("[data-tooltip]"));

  logger.onclick = function () {
    logger.className = (logger.className === "enabled") ? "disabled" : "enabled";
    self.port.emit("logging_changed");
    self.port.emit("update_tooltip", this.dataset.tooltip);
  };

  tooltipElements.forEach(function (element) {
    element.onmouseover = function () {
      self.port.emit("update_tooltip", this.dataset.tooltip);
    };
  });
};

var hideSplashText = function () {
  document.getElementById("init").style.display = "none";
  document.getElementById("data").style.display = "inline";

  // Prevents execution of above DOM calls
  hideSplashText = function () { return; }
};

self.port.on("update_garbage_collector", function (data) {
  hideSplashText();

  // Update widget with current garbage collector activity
  ["gc", "cc"].forEach(function (aType) {
    // Keep old values displayed
    if (!data[aType]) {
      return;
    }

    // Check for an incremental GC
    if (aType === "gc") {
      var label = document.querySelector("#gc .label");
      label.textContent = (data[aType].isIncremental ? "iGC: " : "GC: ");
    }

    var duration = document.querySelector("#" + aType + " .duration");
    duration.textContent = data[aType].duration + "ms";

    if (data[aType].duration >= GARBAGE_COLLECTOR_DURATION_WARNING) {
      duration.className = "duration warning";
    }
    else {
      duration.className = "duration";
    }

    if (data[aType].age) {
      var age = document.querySelector("#" + aType + " .age");
      age.textContent = " (" + data[aType].age + "s)";
    }
  });
});

self.port.on("update_memory", function (data) {
  hideSplashText();

  // Update widget with current memory usage
  ["resident"].forEach(function (aType) {
    if (data[aType]) {
      let element = document.querySelector("#" + aType + " .data");
      element.textContent = Math.round(data[aType] * BYTE_TO_MEGABYTE) + "MB";
    }
  });
});

bindEvents();
