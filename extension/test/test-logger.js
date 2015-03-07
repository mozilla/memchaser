const { Cc, Ci, Cu } = require("chrome");

const { Logger } = require("./logger");

Cu.import('resource://gre/modules/Services.jsm');

const dir = Services.dirsvc.get("TmpD", Ci.nsILocalFile);

var verifyAsyncOutput = function (test, logger, testFunc) {
  var message = '';

  return function (status) {
    var line = {}, hasMore;

    if (typeof status !== "number") {
      test.fail(status);
      return;
    }

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
      try {
        message = JSON.parse(message);
      } catch (e) {
        Cu.reportError("Invalid JSON string: " + message);
        throw e;
      }

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
  test.done();
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

  test.done();
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

exports.test_high_speed_logging = function (test) {
  var logger = new Logger({ dir: dir });
  logger.start();

  var loopLength = 100;
  for (var i = 0; i < loopLength; i++) {
    logger.log('test', { x: i });
  }

  logger.stop(verifyAsyncOutput(test, logger, function (message) {
    test.assertEqual(message.length, loopLength);
    for (var i = 0; i < loopLength; i++) {
      test.assertEqual(message[i].data.x, i);
    }
  }));

  test.waitUntilDone(2000);
}
