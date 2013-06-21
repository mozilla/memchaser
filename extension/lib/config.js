/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";


const self = require('sdk/self');
const xulapp = require('sdk/system/xul-app');


/**
 * List of preferences in use by MemChaser
 */
const PREFERENCES = {
    // Extension related preferences
    log_directory: 'extensions.' + self.id + '.log.directory',
    memory_poll_interval: 'extensions.' + self.id + '.memory.interval',
    modified_prefs: 'extensions.' + self.id + '.modifiedPrefs',

    // Application preferences
    memory_log: 'javascript.options.mem.log',
    memory_notify: 'javascript.options.mem.notify'
}


/**
 * Application related constants
 */
const APPLICATION = {
    branch: parseInt(/^[\d]+/.exec(xulapp.version)[0]),

    topic_cc_statistics: 'cycle-collection-statistics',
    topic_gc_statistics: 'garbage-collection-statistics',
    topic_memory_statistics: 'memory-reporter-statistics'
}


/**
 * Extension related constants
 */
const EXTENSION = {
    memory_poll_interval_default: 5000,

    widget_tooltips : {
      resident_label: "Memory used by the process that is present in physical memory. " +
                      "It does not necessarily have to match the process manager.",
      resident_data: "Memory used by the process that is present in physical memory. " +
                     "It does not necessarily have to match the process manager.",
      gc_label: "GC stands for garbage collection. It attempts to " +
                  "free up Javascript memory that the program no longer uses.",
      gc_duration: "Duration of the last garbage collector activity.",
      gc_age: "The interval between the last two garbage collection activities.",
      cc_label: "CC stands for cycle collection. It attempts to find and free " +
                "groups of XPCOM objects that only refer to each other.",
      cc_duration: "Duration of the last cycle collector activity.",
      cc_age: "The interval between the last two cycle collection activities.",
      logger_enabled: "MemChaser logging is currently enabled. Click to disable.",
      logger_disabled: "MemChaser logging is currently disabled. Click to enable." 
    }
};


exports.application = APPLICATION;
exports.extension = EXTENSION;
exports.preferences = PREFERENCES;
