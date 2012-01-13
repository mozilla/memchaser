Components.utils.import('resource://gre/modules/Services.jsm');


var {Cc, Ci, Cr} = require("chrome");

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
    console.log(msg);
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
