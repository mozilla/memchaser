const BYTE_TO_MEGABYTE = 1/1048576;

const GARBAGE_COLLECTOR_DURATION_WARNING = 100;


/**
 * Get the duration of the given GC or CC entry
 */
var getDuration = function (aEntry) {
  let keys = ['max_slice_pause', 'duration',
              'MaxPause', 'max_pause',
              'Total', 'TotalTime', 'total_time'];
  let key;

  if (keys.some(aKey => {
    key = aKey;
    return key in aEntry;
  })) {
    return aEntry[key];
  }

  return undefined;
}

/**
 * Check if the GC entry is an incremental GC
 */
var isIncrementalGC = function (aEntry) {
  let keys = ['MaxPause', 'max_pause'];

  if ('nonincremental_reason' in aEntry)
    return aEntry['nonincremental_reason'] === 'none';

  return keys.some(aKey => {
    aKey in aEntry;
  });
}

/**
 * Check if the CC entry is an incremental CC
 */
var isIncrementalCC = function (aEntry) {
  if ('total_slice_pause' in aEntry) {
    return aEntry['total_slice_pause'] < aEntry['duration'];
  }

  return false;
}

var isIncrementalCollection = function (aType, aEntry) {
  switch (aType) {
    case "gc":
      return isIncrementalGC(aEntry);
      break;
    case "cc":
      return isIncrementalCC(aEntry);
      break;
  }

  return false;
}


/**
 * Update the values of the specified collector
 */
var updateCollector = function (aType, aData) {

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

  var elem_label = document.querySelector('#' + aType + ' .label');
  elem_label.textContent = (isIncrementalCollection(aType, aData['current'][aType]) ? 'i': '')
                          + aType.toUpperCase() + ': ';

}


window.addEventListener("message", function (aEvent) {
  let { type, data } = aEvent.data;

  switch (type) {
    case "update_cycle_collector":
      updateCollector('cc', data);
      break;

    case "update_garbage_collector":
      updateCollector('gc', data);
      break;

    case "update_memory":
      // Update widget with current memory usage
      ["resident"].forEach(function (aType) {
        if (data[aType]) {
          let element = document.querySelector("#" + aType + " .data");
          element.textContent = Math.round(data[aType] * BYTE_TO_MEGABYTE) + "MB";
        }
      });
      break;
  }
}, false);
