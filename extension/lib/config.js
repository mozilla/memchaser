/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const self = require('self');
const xulapp = require('xul-app');


/**
 * List of preferences in use by MemChaser
 */
const PREFERENCES = {
    // Extension related preferences
    memory_poll_interval: 'extensions.' + self.id + '.memory.interval',
    modified_prefs: 'extensions.' + self.id + '.modifiedPrefs',

    // Application preferences
    memory_log: 'javascript.options.mem.log'
}


/**
 * Application related constants
 */
const APPLICATION = {
    branch: parseInt(/^[\d]+/.exec(xulapp.version)[0])
}


/**
 * Extension related constants
 */
const EXTENSION = {
    memory_poll_interval_default: 5000,

    gc_app_data: {
        "10" : {
            // CC timestamp: 1325854683540071, collected: 75 (75 waiting for GC),
            //               suspected: 378, duration: 19 ms.
            // GC mode: full, timestamp: 1325854678521066, duration: 32 ms.
            "cc" : [
              { label: "collected", regex: " ([^,]+)" },
              { label: "duration", regex: " (\\d+)" },
              { label: "suspected", regex: " (\\d+)" },
            ],
            "gc" : [
              { label: "duration", regex: " (\\d+)" },
              { label: "mode", regex: " (\\w+)" },
            ]
        },
        "11" : {
            // CC(T+9.6) collected: 1821 (1821 waiting for GC), suspected: 18572,
            //           duration: 31 ms.
            // GC(T+0.0) Type:Glob, Total:27.9, Wait:0.6, Mark:13.4, Sweep:12.6, FinObj:3.7,
            //           FinStr:0.2, FinScr:0.5, FinShp:2.1, DisCod:0.3, DisAnl:3.0,
            //           XPCnct:0.8, Destry:0.0, End:2.1, +Chu:16, -Chu:0, Reason:DestC
            "cc" : [
              { label: "collected", regex: " ([^,]+)" },
              { label: "duration", regex: " (\\d+)" },
              { label: "suspected", regex: " (\\d+)" },
            ],
            "gc" : [
              { label: "Total", regex: "([\\d\\.]+)" },
              { label: "Type", regex: "(\\w+)" },
              { label: "Reason", regex: "\\s*(\\w+)" },
            ]
        },
        "13" : {
            // GC(T+0.0) TotalTime: 254.2ms, Type: global, MMU(20ms): 0%, MMU(50ms): 0%, 
            //              Reason: MAYBEGC, +chunks: 0, -chunks: 0 mark: 160.2, 
            //              mark-roots: 5.8, mark-other: 3.6, sweep: 92.0, sweep-obj: 7.9, 
            //              sweep-string: 12.2, sweep-script: 1.2, sweep-shape: 6.7, 
            //              discard-code: 6.8, discard-analysis: 46.4, xpconnect: 3.5, 
            //              deallocate: 0.4
            // GC(T+141.6) TotalTime: 21.4ms, Type: global, MMU(20ms): 39%, MMU(50ms): 75%,
            //             MaxPause: 12.0, +chunks: 0, -chunks: 0
            //             Slice 0 @ 12.0ms (Pause: 12.0, Reason: PAGE_HIDE): mark: 11.6,
            //                               mark-roots: 1.5
            //             Slice 2 @ 222.2ms (Pause: 7.2, Reason: INTER_SLICE_GC): mark: 1.2,
            //                               mark-delayed: 0.1, mark-other: 1.0, sweep: 5.2,
            //                               sweep-obj: 1.0, sweep-string: 0.1,
            //                               sweep-script: 0.1, sweep-shape: 0.9,
            //                               discard-code: 0.1, discard-analysis: 1.1,
            //                               xpconnect: 0.7, deallocate: 0.1
            //             Totals: mark: 14.9, mark-roots: 1.5, mark-delayed: 0.3,
            //                     mark-other: 1.0, sweep: 5.2, sweep-obj: 1.0,
            //                     sweep-string: 0.1, sweep-script: 0.1, sweep-shape: 0.9,
            //                     discard-code: 0.1, discard-analysis: 1.1,
            //                     xpconnect: 0.7, deallocate: 0.1
            // CC(T+0.0) collected: 76 (76 waiting for GC), suspected: 555, duration: 16 ms.
            //           ForgetSkippable 42 times before CC, min: 0 ms, max: 21 ms, 
            //           avg: 1 ms, total: 50 ms, removed: 7787
            "cc" : [
              { label: "collected", regex: " ([^,\\n]+)" },
              { label: "duration", regex: " (\\d+)" },
              { label: "suspected", regex: " (\\d+)" },
            ],
            "gc" : [
              { label: "MaxPause", regex: " ([\\d\\.]+)" },
              { label: "TotalTime", regex: " ([\\d\\.]+)" },
              { label: "Type", regex: " (\\w+)" },
              { label: "Reason", regex: "\\s*(\\w+)" },
            ]
        },
        "14" : {
            // GC(T+9.7) Total Time: 21.4ms, Type: global, MMU (20ms): 0%, MMU (50ms): 57%,
            //           Reason: CC_WAITING, Nonincremental Reason: GC mode, +Chunks: 0,
            //           -Chunks: 0
            //           Totals: Mark: 17.0ms, Mark Roots: 2.1ms, Mark Other: 1.3ms,
            //           Sweep: 4.1ms, Sweep Object: 0.5ms, Sweep String: 0.0ms,
            //           Sweep Script: 0.1ms, Sweep Shape: 0.8ms, Discard Code: 0.2ms,
            //           Discard Analysis: 0.2ms, XPConnect: 0.5ms, Deallocate: 0.1ms
            //
            // GC(T+73.6) Total Time: 34.2ms, Type: global, MMU (20ms): 33%, MMU (50ms): 73%,
            //            Max Pause: 13.3ms, +Chunks: 0, -Chunks: 0
            //              Slice: 0, Time: 13.3ms (Pause: 13.3, Reason: CC_WAITING):
            //                Mark: 12.8ms, Mark Roots: 2.8ms
            //              Slice: 3, Time: 337.2ms (Pause: 9.1, Reason: INTER_SLICE_GC):
            //                Mark: 2.5ms, Mark Delayed: 0.1ms, Mark Other: 2.4ms,
            //                Sweep: 6.2ms, Sweep Object: 0.7ms, Sweep String: 0.0ms,
            //                Sweep Script: 0.1ms, Sweep Shape: 1.0ms, Discard Code: 0.3ms,
            //                Discard Analysis: 0.3ms, XPConnect: 0.7ms, Deallocate: 0.0ms
            //            Totals: Mark: 27.1ms, Mark Roots: 2.8ms, Mark Delayed: 0.2ms,
            //            Mark Other: 2.4ms, Sweep: 6.2ms, Sweep Object: 0.7ms,
            //            Sweep String: 0.0ms, Sweep Script: 0.1ms, Sweep Shape: 1.0ms,
            //            Discard Code: 0.3ms, Discard Analysis: 0.3ms, XPConnect: 0.7ms,
            //            Deallocate: 0.0ms
            //
            // CC(T+18.3) duration: 8ms, suspected: 116, visited: 4079 RCed and 6640 GCed,
            //            collected: 50 RCed and 0 GCed (50 waiting for GC)
            //            ForgetSkippable 2 times before CC, min: 0 ms, max: 1 ms,
            //            avg: 1 ms, total: 2 ms, removed: 109
            "cc" : [
              { label: "collected", regex: " ([^,\\n]+)" },
              { label: "duration", regex: " (\\d+)" },
              { label: "suspected", regex: " (\\d+)" },
            ],
            "gc" : [
              { label: "Max Pause", regex: " ([\\d\\.]+)" },
              { label: "Total Time", regex: " ([\\d\\.]+)" },
              { label: "Type", regex: " (\\w+)" },
              { label: "Reason", regex: "\\s*(\\w+)" },
            ]
        }
    },

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
