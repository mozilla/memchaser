/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const circular_buffer = require("circular-buffer");

exports.test_state = function(test) {
  var buffer = circular_buffer.CircularBuffer(10);
  
  test.assertEqual(buffer.size(), 10, "Size of buffer should be 10");
  test.assert(!buffer.isFull(), "Buffer should not be full");
  
  buffer.write({resident:1,GC:2,CC:3});
  test.assert(!buffer.isFull(), "Buffer should not be full");
  
  for (var i = 0; i < 9; i += 1)
    buffer.write({resident:1,GC:2,CC:3});
  test.assert(buffer.isFull(), "Buffer should be full");
};

exports.test_readwrite = function(test) {
  var buffer = circular_buffer.CircularBuffer(5);
  
  test.assertEqual(buffer.read(), undefined, "An empty read should be undefined");

  buffer.write({resident:1,GC:2,CC:3});
  test.assertEqual(buffer.read().GC, 2, "GC field in retrieved data should be 2");
  
  buffer.write({resident:1,GC:2,CC:3});
  buffer.write({resident:1,GC:3,CC:3});
  buffer.write({resident:1,GC:4,CC:3});
  buffer.write({resident:1,GC:5,CC:3});
  buffer.write({resident:1,GC:6,CC:3});
  // Should overwrite the first write
  buffer.write({resident:1,GC:7,CC:3});
  // Should overwrite the second write
  buffer.write({resident:1,GC:8,CC:3});
  
  test.assertEqual(buffer.back().GC, 8, "GC field in last written data should be 8");
  
  test.assertEqual(buffer.read().GC, 4, "GC field in retrieved data should be 4");
  test.assertEqual(buffer.read(1).GC, 5, "GC field in retrieved data should be 5");
  test.assertEqual(buffer.read(2).GC, 6, "GC field in retrieved data should be 6");
  test.assertEqual(buffer.read(3).GC, 7, "GC field in retrieved data should be 7");
  test.assertEqual(buffer.read(4).GC, 8, "GC field in retrieved data should be 8");
};

exports.test_clear = function(test) {
  var buffer = circular_buffer.CircularBuffer(5);
  
  buffer.write({resident:1,GC:2,CC:3});
  buffer.write({resident:1,GC:3,CC:3});
  buffer.write({resident:1,GC:4,CC:3});
  buffer.write({resident:1,GC:5,CC:3});
  buffer.write({resident:1,GC:6,CC:3});
  buffer.clear();
  test.assertEqual(buffer.read(), undefined, "An empty read should be undefined");

};