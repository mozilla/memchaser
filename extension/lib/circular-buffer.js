/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { EventEmitter } = require("api-utils/events");
const unload = require("api-utils/unload");

const ON_READ = "bufferRead";
const ON_WRITE = "bufferWrite";

var buffer = EventEmitter.compose({
  constructor: function CircularBuffer(length) {
    // Report unhandled errors from listeners
    this.on("error", console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');

    this._size = length;
    this._head = 0;
    this._tail = 0;
    this._buffer = [];
    this._isLastOpAWrite = false;
    
    // Ensure a minimum length of 1
    if (typeof(length) == 'undefined' || length < 1)
      this._size = 1;
  },
  
  size: function CircularBuffer_size() {
    return this._size;
  },
  
  unload: function CircularBuffer_unload() {
    this._removeAllListeners(ON_WRITE);
  },
  
  // Returns the next 
  nextIndex: function CircularBuffer_nextIndex(index) {
    if (index >= (this._size - 1))
      return 0;
    return (index + 1);
  },

  prevIndex: function CircularBuffer_prevIndex(index) {
    if (index <= 0)
      return (this._size - 1);
    return (index - 1);
  },

  // Reads earliest inserted data and returns it
  read: function CircularBuffer_read() {
    const DATA = this._buffer[this._head];
    
    if (this.isEmpty())
      return 'undefined';
    this._head = this.nextIndex(this._head);
    this._isLastOpAWrite = false;
    this._emit(ON_READ);
    return DATA;
  },

  // Reads earliest inserted data, removes it, and returns it
  dequeue: function CircularBuffer_dequeue() {
    const DATA = this._buffer[this._head];
    
    if (this.isEmpty())
      return 'undefined';
    this._buffer[this._head] = 'undefined';
    this._head = this.nextIndex(this._head);
    this._isLastOpAWrite = false;
    this._emit(ON_READ);
    return DATA;
  },

  // Reads last inserted data and returns it
  back: function CircularBuffer_back() {
    if (this.isEmpty())
      return 'undefined';
    return this._buffer[this.prevIndex(this._tail)];
  },

  write: function CircularBuffer_write(data) {
    if (this.isFull())
      this._head = this.nextIndex(this._head);
    this._buffer[this._tail] = data;
    this._tail = this.nextIndex(this._tail);
    this._isLastOpAWrite = true;
    this._emit(ON_WRITE);
  },
  
  clear: function CircularBuffer_clear(data) {
    this._buffer.length = 0;
    this._head = 0;
    this._tail = 0;
    this._isLastOpAWrite = false;
  },

  isEmpty: function CircularBuffer_isEmpty() {
    if (this._head !== this._tail)
      return false;
    return !this._isLastOpAWrite;
  },

  isFull: function CircularBuffer_isFull() {
    if (this._head !== this._tail)
      return false;
    return this._isLastOpAWrite;
  }
});

exports.CircularBuffer = buffer;
