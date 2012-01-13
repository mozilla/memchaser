/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MemChaser code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <mail@hskupin.info> (Original Author)
 *   Dave Hunt <dhunt@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */


Components.utils.import('resource://gre/modules/Services.jsm');

/**
 * Until we have an available API to retrieve GC related information we have to
 * parse the console messages in the Error Console
 *
 * Firefox <11
 * GC mode: full, timestamp: 1325854678521066, duration: 32 ms.
 * CC timestamp: 1325854683540071, collected: 75 (75 waiting for GC),
 *               suspected: 378, duration: 19 ms.
 *
 * Firefox >=11
 * GC(T+0.0) Type:Glob, Total:27.9, Wait:0.6, Mark:13.4, Sweep:12.6, FinObj:3.7,
 *           FinStr:0.2, FinScr:0.5, FinShp:2.1, DisCod:0.3, DisAnl:3.0,
 *           XPCnct:0.8, Destry:0.0, End:2.1, +Chu:16, -Chu:0, Reason:DestC
 * CC(T+9.6) collected: 1821 (1821 waiting for GC), suspected: 18572,
 *           duration: 31 ms.
 **/

// For now simply store the latest GC and CC duration values
var gData = {'explicit': 'n/a', 'GC': 'n/a', 'CC': 'n/a' };

var memMgr = Cc["@mozilla.org/memory-reporter-manager;1"].
             getService(Ci.nsIMemoryReporterManager);

var timer = Cc["@mozilla.org/timer;1"].
            createInstance(Ci.nsITimer);

var TYPE_REPEATING_PRECISE = Ci.nsITimer.TYPE_REPEATING_PRECISE;
var BYTE_TO_MEGABYTE = 1/1048576;

function ConsoleListener() {
  this.register();
}

ConsoleListener.prototype = {
  observe: function(aMessage) {
    var msg = aMessage.message;

    // Only process messages from the garbage collector
    if (! msg.match(/^(CC|GC).*/i))
      return;

    // Parse GC/CC duration from the message
    /^(CC|GC).*(duration: ([\d\.]+)|Total:([\d\.]+))/i.exec(msg);
    gData[RegExp.$1] = ((RegExp.$4) ? RegExp.$4 : RegExp.$3) + 'ms';

    updateLabel();
  },

  QueryInterface: function (iid) {
    if (!iid.equals(Ci.nsIConsoleListener) &&
        !iid.equals(Ci.nsISupports)) {
      throw Cr.NS_ERROR_NO_INTERFACE;
    }

    return this;
  },

  register: function() {
    Services.console.registerListener(this);
  },

  unregister: function() {
    Services.console.unregisterListener(this);
  }
}

function pollMetrics() {
    gData['explicit'] = Math.round(memMgr.explicit * BYTE_TO_MEGABYTE) + 'MB';
    updateLabel();
}

function updateLabel() {
  var label = document.getElementById("memchaser-toolbar-duration");
  label.value = "Memory=" + gData['explicit'] + ", GC=" + gData['GC'] + ', CC=' + gData['CC'];
}

var gMemChaser = {

  init : function gMemChaser_init() {
    window.removeEventListener("load", arguments.callee, false);

    // On firstrun auto-add the toolbar item to the add-on bar
    let firstRun = Services.prefs.getBoolPref("extensions.memchaser.firstrun");
    if (firstRun) {
      let addonBar = document.getElementById("addon-bar");
      let currentSet = addonBar.currentSet;

      if (currentSet.indexOf("memchaser-toolbar-item") === -1) {
        addonBar.currentSet += ",memchaser-toolbar-item";
        addonBar.setAttribute("currentset", addonBar.currentSet);
        document.persist("addon-bar", "currentset");
        addonBar.collapsed = false;
        Services.prefs.setBoolPref("extensions.memchaser.firstrun", false);
      }
    }

    let interval = Services.prefs.getIntPref("extensions.memchaser.interval");
    timer.init(pollMetrics, interval, TYPE_REPEATING_PRECISE);
  }
}


// start listening
var consoleListener = new ConsoleListener();

window.addEventListener("load", gMemChaser.init, false);
