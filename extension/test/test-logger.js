Components.utils.import('resource://gre/modules/Services.jsm');

const { Cc, Ci } = require("chrome");
const { Logger } = require("memchaser/logger");
const prefs = require('api-utils/preferences-service');

const dir = Services.dirsvc.get("TmpD", Ci.nsILocalFile);

var verifyAsyncOutput = function (test, logger, testFunc) {
  var message = '';

  return function (status) {
    var line = {}, hasMore;

    try {
      // open an input stream from file
      var istream = Cc["@mozilla.org/network/file-input-stream;1"].
                    createInstance(Ci.nsIFileInputStream);
      istream.init(logger.file, 0x01, parseInt("0444",8), 0);
      istream.QueryInterface(Ci.nsILineInputStream);

      // read lines into array
      do {
        hasMore = istream.readLine(line);
        message += line.value;
      } while (hasMore);
    }
    finally {
      istream.close();
      message = JSON.parse(message);

      if (typeof(testFunc) === 'function') {
        testFunc(message);
      }

      logger._file.remove(false);
      test.assert(!logger._file.exists(), "Clean-up; delete test file");
      test.done();
    }
  };
}

exports.test_default_to_not_logging = function (test) {
  var logger = new Logger({ dir: dir });

  test.assert(!logger.active);
}

exports.test_start_stop_logging = function (test) {
  var logger = new Logger({ dir: dir });

  logger.start();
  test.assert(logger.active);

  logger.stop();
  test.assert(!logger.active);

  logger.active = true;
  test.assert(logger.active);

  logger.active = false;
  test.assert(!logger.active);

  logger._file.remove(false);
  test.assert(!logger._file.exists(), "Clean-up; delete test file");
}

exports.test_log_and_callback = function (test) {
  var logger = new Logger({ dir: dir });

  logger.start();
  logger.log('test', { x: 50 });
  logger.log('test', { x: 60 });
  logger.log('test', { x: 70 });
  logger.stop(verifyAsyncOutput(test, logger, function (message) {
    test.assertEqual(message.length, 3);
    test.assertEqual(message[0].data.x, 50);
    test.assertEqual(message[1].data.x, 60);
    test.assertEqual(message[2].data.x, 70);
  }));

  test.waitUntilDone(2000);
}

exports.test_start_directory_change_nsIFile = function (test) {
  var logger = new Logger({ dir: dir });
  var newDir = dir.clone();
  newDir.append('newdir');

  logger.dir = newDir;
  logger.start();
  logger.log('test', { x: 50 });
  logger.log('test', { x: 60 });
  logger.log('test', { x: 70 });
  logger.stop(verifyAsyncOutput(test, logger, function (message) {
    test.assertEqual(message.length, 3);
    test.assertEqual(message[0].data.x, 50);
    test.assertEqual(message[1].data.x, 60);
    test.assertEqual(message[2].data.x, 70);
  }));
    
  test.waitUntilDone(2000);
}

exports.test_start_directory_change_string = function (test) {
  var logger = new Logger({ dir: dir });
  var newDir = dir.clone();
  newDir.append('newdir');

  logger.dir = newDir.path;
  logger.start();
  logger.log('test', { x: 50 });
  logger.log('test', { x: 60 });
  logger.log('test', { x: 70 });
  logger.stop(verifyAsyncOutput(test, logger, function (message) {
    test.assertEqual(message.length, 3);
    test.assertEqual(message[0].data.x, 50);
    test.assertEqual(message[1].data.x, 60);
    test.assertEqual(message[2].data.x, 70);
  }));

  test.waitUntilDone(2000);
}
