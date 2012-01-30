/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { EventEmitter } = require("api-utils/events");
const unload = require("api-utils/unload");

const ON_WRITE = "bufferWrite";

var buffer = EventEmitter.compose({
  constructor: function CircularBuffer(length) {
    // Ensure a minimum length of 1
    if (typeof(length) == 'undefined' || length < 1)
      this._size = 1;
    else
      this._size = length;
      
    // Report unhandled errors from listeners
    this.on("error", console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');

    this._head = 0;
    this._tail = 0;
    this._buffer = Array(this._size);
    this._dataWritten = false;
  },
  
  size: function CircularBuffer_size() {
    return this._size;
  },
  
  unload: function CircularBuffer_unload() {
    this._removeAllListeners(ON_WRITE);
  },
  
  // Returns the next index adjusted for cycles
  nextIndex: function CircularBuffer_nextIndex(index) {
    return ((index + 1) % this.size());
  },

  prevIndex: function CircularBuffer_prevIndex(index) {
    return ((index - 1) % this.size());
  },

  // Reads indexed data and returns it
  read: function CircularBuffer_read(index) {
    index = typeof(index) != 'undefined' ? index : 0;
    const DATA = this._buffer[(this._head + index) % this.size()];
    return DATA;
  },

  // Reads data from the head, removes it, and returns it
  dequeue: function CircularBuffer_dequeue() {
    const DATA = this.read();
    if (DATA == undefined)
      return undefined;
    this._buffer[this._head] = undefined;
    this._head = this.nextIndex(this._head);
    return DATA;
  },

  // Reads last inserted data and returns it
  back: function CircularBuffer_back() {
    return this._buffer[this.prevIndex(this._tail)];
  },

  write: function CircularBuffer_write(data) {
    if (this.isFull())
      this._head = this.nextIndex(this._head);
    this._buffer[this._tail] = data;
    this._tail = this.nextIndex(this._tail);
    this._dataWritten = true;
    this._emit(ON_WRITE, data);
  },
  
  clear: function CircularBuffer_clear(data) {
    this._buffer.length = 0;
    this._head = 0;
    this._tail = 0;
    this._dataWritten = false;
  },

  isFull: function CircularBuffer_isFull() {
    if (this._head !== this._tail)
      return false;
    return this._dataWritten;
  }
});

exports.CircularBuffer = buffer;
