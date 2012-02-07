var { Cc, Ci } = require("chrome");
var { Logger } = require("memchaser/logger")
var dir = Cc["@mozilla.org/file/directory_service;1"]
          .getService(Ci.nsIProperties).get("TmpD", Ci.nsIFile);

exports.test_default_to_not_logging = function (test) {
  var logger = new Logger({aDir: dir});

  test.assert(!logger.active);
}


exports.test_start_stop_logging = function (test) {
  var logger = new Logger({aDir: dir});

  logger.start();
  test.assert(logger.active);

  logger.stop();
  test.assert(!logger.active);

  //logger.file.remove(false);
}

exports.test_log = function (test) {
  var logger = new Logger({aDir: dir});
  
  logger.start();
  logger.log({GC: 50});
  logger.log({GC: 60});
  logger.log({GC: 70});

  
// open an input stream from file  
  var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].  
                createInstance(Components.interfaces.nsIFileInputStream);  
  istream.init(logger.file, 0x01, 0444, 0);  
  istream.QueryInterface(Components.interfaces.nsILineInputStream);  
    
  // read lines into array  
  var line = {}, lines = [], hasmore;  
  do {  
    hasmore = istream.readLine(line);  
    lines.push(line.value);   
  } while(hasmore);  
  
  istream.close();  
  test.assert(lines[0].indexOf(':50') != -1, 'data');
  test.assert(lines[1].indexOf(':60') != -1, 'data');
  test.assert(lines[2].indexOf(':70') != -1, 'data');
  //logger.file.remove(false);  
}
