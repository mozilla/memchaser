/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { CircularBuffer } = require("circular-buffer");
const TestData = [];

// Populate test data
for (var i = 0; i < 10; i += 1) {
  TestData.push({ test: i });
}
exports.test_state = function (test) {
  var buffer = CircularBuffer({ length: 10 });
  
  test.assertEqual(buffer.length, 10, "Size of buffer should be 10");
  test.assert(!buffer.isFull(), "Buffer should not be full");
  
  buffer.push(TestData[0]);
  test.assert(!buffer.isFull(), "Buffer should not be full");
  
  // Pushes data to make buffer full
  for (var i = 1; i < 10; i += 1) {
    buffer.push(TestData[i]);
  }
  test.assert(buffer.isFull(), "Buffer should be full");
};

exports.test_readpush = function (test) {
  var buffer = CircularBuffer({ length: 5 });
  
  test.assertEqual(typeof(buffer.read()), 'undefined', 
                   "An empty read should be undefined");
  
  for (var i = 0; i < 5; i += 1) {
    buffer.push(TestData[i]);
  }
  
  // Removes the entry from the first push
  buffer.push(TestData[5]);
  
  // Removes the entry from the second push
  buffer.push(TestData[6]);
  
  // Read with a negative index
  for (var i = 1; i < 5; i += 1) {
    test.assertEqual(buffer.read(-i).test, 7 - i,
                     "Test field in retrieved data should be " + (7 - i));
  }
 
  // Read with a positive index
  for (var i = 0; i < 5; i += 1) {
    test.assertEqual(buffer.read(i).test, i + 2, 
                     "Test field in retrieved data should be " + (i + 2));
  } 
};

exports.test_front_ops = function (test) {
  var buffer = CircularBuffer( {length: 5} );

  for (var i = 0; i < 5; i += 1) {
    buffer.unshift(TestData[i]);
  }

  // Removes the entry from the first unshift
  buffer.unshift(TestData[5]);
  
  // Removes the entry from the second unshift
  buffer.unshift(TestData[6]);  
  
  for (var i = 0; i < 5; i += 1) {
    test.assertEqual(buffer.shift().test, 6 - i, 
                     "Test field in shifted data should be " + (6 - i));
  }

  test.assertEqual(buffer.shift(), undefined, 
                   "Shifted data empty buffer should be undefined");
  test.assert(buffer.isEmpty(), "Buffer should be empty");
};

exports.test_back_ops = function (test) {
  var buffer = CircularBuffer({ length: 5 });

  for (var i = 0; i < 5; i += 1) {
    buffer.unshift(TestData[i]);
  }

  // Removes the entry from the first unshift
  buffer.unshift(TestData[5]);
  
  // Removes the entry from the second unshift
  buffer.unshift(TestData[6]); 
  
  for (var i = 0; i < 5; i += 1) {
    test.assertEqual(buffer.pop().test, i + 2,
                     "Test field in popped data should be " + (i + 2));
  }

  test.assertEqual(buffer.pop(), undefined, 
                   "Test field in popped data should be undefined");
  test.assert(buffer.isEmpty(), "Buffer should be empty");
};

exports.test_clear = function (test) {
  var buffer = CircularBuffer({ length: 5 });
  
  for (var i = 0; i < 5; i += 1) {
    buffer.push(TestData[i]);
  }

  buffer.clear();
  
  test.assertEqual(buffer.read(), undefined, "An empty read should be undefined");
  test.assertEqual(buffer.length, 5, "Buffer's length has not been changed");
  test.assert(buffer.isEmpty(), "Buffer should be empty");

};

exports.test_resize_smaller = function (test) {
  var buffer = CircularBuffer({ length: 6 });

  for (var i = 0; i < 6; i += 1) {
    buffer.push(TestData[i]);
  }

  buffer.length = 4;

  test.assert(buffer.isFull(), "Buffer should be full");

  for (var i = 0; i < 4; i += 1) {
    test.assertEqual(buffer.shift().test, i + 2,
                     "Test field in shifted data should be " + (i + 2));
  }

  test.assert(buffer.isEmpty(), "Buffer should be empty");
}

exports.test_resize_smaller_with_push_after = function (test) {
  var buffer = CircularBuffer({ length: 6 });

  for (var i = 0; i < 6; i += 1) {
    buffer.push(TestData[i]);
  }

  buffer.length = 4;

  // Removes the first two entries
  buffer.push(TestData[6]);
  buffer.push(TestData[7]);

  for (var i = 0; i < 4; i += 1) {
    test.assertEqual(buffer.shift().test, i + 4, 
                     "Test field in shifted data should be " + (i + 4));
  }

  test.assert(buffer.isEmpty(), "Buffer should be empty");
}

exports.test_resize_bigger = function (test) {
  var buffer = CircularBuffer({ length: 6 });

  for (var i = 0; i < 6; i += 1) {
    buffer.push(TestData[i]);
  }

  buffer.length = 8;

  for (var i = 0; i < 6; i += 1) {
  test.assertEqual(buffer.shift().test, i,
                   "Test field in shifted data should be " + i);
  }

  test.assert(!buffer.isFull(), "Buffer should not be full");
}

exports.test_resize_bigger_with_write_after = function (test) {
  var buffer = CircularBuffer({ length: 6 });

  for (var i = 0; i < 6; i += 1) {
    buffer.push(TestData[i]);
  }

  buffer.length = 8;

  buffer.push(TestData[6]);
  buffer.push(TestData[7]);

  // Removes the first entry
  buffer.push(TestData[8]);

  test.assert(buffer.isFull(), "Buffer should be full");

  for (var i = 0; i < 8; i += 1) {
    test.assertEqual(buffer.shift().test, i + 1,
                     "Test field in shifted data should be " + (i + 1));
  }

  test.assert(buffer.isEmpty(), "Buffer should be empty");
}

exports.test_count = function (test) {
  var buffer = CircularBuffer({ length: 5 });

  for (var i = 0; i < 5; i += 1) {
    buffer.push(TestData[i]);
    test.assertEqual(buffer.count, i + 1, "Buffer count should be " + (i + 1));
  }

  for (var i = 5; i < 10; i += 1) {
    buffer.push(TestData[i]);
    test.assertEqual(buffer.count, 5, "Buffer count should be 5");    
  }

  for (var i = 1; i <= 5; i += 1) {
    buffer.pop();
    test.assertEqual(buffer.count, 5 - i, "Buffer count should be " + (5 - i));    
  }
}

exports.test_write_event = function (test) {
  var buffer = CircularBuffer({ length: 5 });

  buffer.on("buffer_write", function (data) {
    test.assertEqual(data, TestData[0]);
    test.done();
  })

  buffer.push(TestData[0]);
  test.waitUntilDone(2000);
}

exports.test_remove_event = function (test) {
  var buffer = CircularBuffer({ length: 5 });

  buffer.on("buffer_remove", function () {
    test.assert(true);
    test.done();
  })

  buffer.push(TestData[0]);
  buffer.pop();
  test.waitUntilDone(2000);
}