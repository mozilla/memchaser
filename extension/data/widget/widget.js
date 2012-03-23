const BYTE_TO_MEGABYTE = 1/1048576;

const GARBAGE_COLLECTOR_DURATION_WARNING = 100;

var bindEvents = function () {
  let logger = document.getElementById("logger");
  let tooltipElements = [].slice.call(document.querySelectorAll("[data-tooltip]"));

  logger.onclick = function () {
    self.port.emit("logger_click");
    self.port.emit("update_tooltip", this.dataset.tooltip);
  };

  tooltipElements.forEach(function (element) {
    element.onmouseover = function () {
      self.port.emit("update_tooltip", this.dataset.tooltip);
    };
  });
};

/**
 * Get the duration of the given GC or CC entry
 */
var getDuration = function (aEntry) {
  let keys = ['duration',
              'MaxPause', 'max_pause',
              'Total', 'TotalTime', 'total_time'];

  for each (let key in keys) {
    if (key in aEntry) {
      return aEntry[key];
    }
  };

  return undefined;
}

/**
 * Hide the initialization element and show real values
 */
var hideSplashText = function () {
  document.getElementById("init").style.display = "none";
  document.getElementById("data").style.display = "inline";

  // Prevents execution of above DOM calls
  hideSplashText = function () { return; }
};

/**
 * Check if the GC entry is an incremental GC
 */
var isIncrementalGC = function (aEntry) {
  let keys = ['MaxPause', 'max_pause'];

  if ('nonincremental_reason' in aEntry)
    return aEntry['nonincremental_reason'] === 'none';

  for each (let key in keys) {
    if (key in aEntry) {
      return true;
    }
  }

  return false;
}


self.port.on("logger_update", function (data) {
  let logger = document.getElementById("logger");

  logger.className = (data["active"]) ? "enabled" : "disabled";
});

/**
 * Update the values of the specified collector
 */
var updateCollector = function (aType, aData) {
  hideSplashText();

  let duration = getDuration(aData['current'][aType]);
  let age;

  if (aData['previous'][aType]) {
    let currentTime = aData['current'][aType]['timestamp'];
    let previousTime = aData['previous'][aType]['timestamp'];
    age = (currentTime - previousTime - duration) * 0.001;
  }

  let elem_duration = document.querySelector('#' + aType + ' .duration');
  elem_duration.textContent = duration + 'ms';

  if (duration >= GARBAGE_COLLECTOR_DURATION_WARNING) {
    elem_duration.className = 'duration warning';
  }
  else {
    elem_duration.className = 'duration';
  }

  let elem_age = document.querySelector('#' + aType + ' .age');
  elem_age.textContent = (age === undefined) ? '' : ' (' + age.toFixed(1) + 's)';

  // Garbage collector specific values
  if (aType === 'gc') {
    var elem_label = document.querySelector('#' + aType + ' .label');
    elem_label.textContent = isIncrementalGC(aData['current'][aType]) ? 'iGC: '
                                                                      : 'GC: ';
  }

}

self.port.on('update_cycle_collector', function (aData) {
  updateCollector('cc', aData);
});

self.port.on("update_garbage_collector", function (aData) {
  updateCollector('gc', aData);
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
