const { Cc, Ci, Cu } = require("chrome");

const { Logger } = require("../lib/logger");

Cu.import('resource://gre/modules/Services.jsm');

const dir = Services.dirsvc.get("TmpD", Ci.nsILocalFile);

var verifyAsyncOutput = function (assert, done, logger, testFunc) {
  var message = '';

  return function (status) {
    var line = {}, hasMore, isSuccessStatus;

    isSuccessStatus = typeof status == "number";
    assert.ok(isSuccessStatus, status["message"] ? status.message : "Async write works");
    if (!isSuccessStatus) {
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
        Cu.reportError("Invalid JSON string: '" + message + "'");
        throw e;
      }

      if (typeof(testFunc) === 'function') {
        testFunc(message);
      }

      logger._file.remove(false);
      assert.ok(!logger._file.exists(), "Clean-up; delete test file");
      done();
    }
  };
}

exports.test_default_to_not_logging = function (assert, done) {
  var logger = new Logger({ dir: dir });

  assert.ok(!logger.active, "new Logger is inactive by default");
  done();
}

exports.test_start_stop_logging = function (assert, done) {
  var logger = new Logger({ dir: dir });

  logger.start();
  assert.ok(logger.active, "Logger is active after start()");

  logger.stop();
  assert.ok(!logger.active, "Logger is inactive after stop()");

  logger.active = true;
  assert.ok(logger.active, "Logger is active after setting |active| directly to true");

  logger.active = false;
  assert.ok(!logger.active, "Logger is inactive after setting |active| directly to false");

  done();
}

exports.test_log_and_callback = function (assert, done) {
  var logger = new Logger({ dir: dir });

  logger.start();
  logger.log('test', { x: 50 });
  logger.log('test', { x: 60 });
  logger.log('test', { x: 70 });
  logger.stop(verifyAsyncOutput(assert, done, logger, function (message) {
    assert.equal(message.length, 3, "Log length is 3");
    assert.equal(message[0].data.x, 50, "The 1st element is 50 in the log");
    assert.equal(message[1].data.x, 60, "The 2nd element is 60 in the log");
    assert.equal(message[2].data.x, 70, "The 3rd element is 70 in the log");
  }));
}

exports.test_start_directory_change_nsIFile = function (assert, done) {
  var logger = new Logger({ dir: dir });
  var newDir = dir.clone();
  newDir.append('newdir');

  logger.dir = newDir;
  logger.start();
  logger.log('test', { x: 50 });
  logger.log('test', { x: 60 });
  logger.log('test', { x: 70 });
  logger.stop(verifyAsyncOutput(assert, done, logger, function (message) {
    assert.equal(message.length, 3, "Log length is 3");
    assert.equal(message[0].data.x, 50, "The 1st element is 50 in the log");
    assert.equal(message[1].data.x, 60, "The 2nd element is 60 in the log");
    assert.equal(message[2].data.x, 70, "The 3rd element is 70 in the log");
  }));
}

exports.test_start_directory_change_string = function (assert, done) {
  var logger = new Logger({ dir: dir });
  var newDir = dir.clone();
  newDir.append('newdir');

  logger.dir = newDir.path;
  logger.start();
  logger.log('test', { x: 50 });
  logger.log('test', { x: 60 });
  logger.log('test', { x: 70 });
  logger.stop(verifyAsyncOutput(assert, done, logger, function (message) {
    assert.equal(message.length, 3, "Log length is 3");
    assert.equal(message[0].data.x, 50, "The 1st element is 50 in the log");
    assert.equal(message[1].data.x, 60, "The 2nd element is 60 in the log");
    assert.equal(message[2].data.x, 70, "The 3rd element is 70 in the log");
  }));
}

exports.test_high_speed_logging = function (assert, done) {
  var logger = new Logger({ dir: dir });
  logger.start();

  var loopLength = 100;
  for (var i = 0; i < loopLength; i++) {
    logger.log('test', { x: i });
  }

  logger.stop(verifyAsyncOutput(assert, done, logger, function (message) {
    assert.equal(message.length, loopLength, "Log length is " + loopLength);
    for (var i = 0; i < loopLength; i++) {
      var element = message[i].data.x;
      assert.equal(element, i, "The " + (i+1) + ". element is " + element + " in the log");
    }
  }));
}

require("sdk/test").run(exports);
