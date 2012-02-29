/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const APP_BRANCH = parseInt(/^[\d]+/.exec(require("xul-app").version)[0]);


/**
 * GC/CC key:value pairs we are interested in
 */
const GARBAGE_COLLECTOR_DATA = {
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
    }
};


exports.APP_BRANCH = APP_BRANCH;
exports.GARBAGE_COLLECTOR_DATA = GARBAGE_COLLECTOR_DATA;
