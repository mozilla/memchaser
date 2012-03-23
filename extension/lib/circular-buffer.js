/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { EventEmitter } = require('api-utils/events');
const unload = require('api-utils/unload');

const ON_WRITE = 'buffer_write';
const ON_REMOVE = 'buffer_remove';

var buffer = EventEmitter.compose({
  constructor: function CircularBuffer(aOptions) {
    var options = aOptions || {};

    this._length = options.length || 60;
    if (this._length < 1) {
      throw new RangeError('Invalid length');
    }

    this._front = 0;
    this._back = 0;
    this._buffer = [];
    this._buffer.length = this._length;
    this._count = 0;
    
    // Report unhandled errors from listeners
    this.on('error', console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');
  },

  unload: function CircularBuffer_unload() {
    this._removeAllListeners(ON_WRITE);
    this._removeAllListeners(ON_REMOVE);
  },

  /**
   * Returns the next index, adjusted for cycles
   */
  _nextIndex: function CircularBuffer_nextIndex(aIndex) {
    return (aIndex + 1) % this._length;
  },

  /**
   * Returns the previous index, adjusted for cycles
   */
  _prevIndex: function CircularBuffer_prevIndex(aIndex) {
    var index = (aIndex - 1) % this._length;

    if (index < 0) {
      index += this._length;
    }
    return index;
  },

  get count() {
    return this._count;
  },
  
  get length() {
    return this._length;
  },

  set length(aNewLength) {
    if (aNewLength < 0) {
      throw new RangeError('Invalid length');
    }

    // Normalize the circular buffer as a FIFO buffer
    if (this._front > this._back) {
      this._buffer.push.apply(this._buffer, 
                              this._buffer.slice(this._front));
      this._buffer.push.apply(this._buffer, 
                              this._buffer.slice(this._back, this._front));
    }
    else {
      this._buffer.push.apply(this._buffer, 
                              this._buffer.slice(this._front, this._back));
    }

    this._buffer = this._buffer.slice(0, this._length);

    // Truncate the oldest elements if new length is less than original
    if (aNewLength < this._length) {
      this._buffer = this._buffer.slice(this._length - aNewLength);
    }

    this._buffer.length = aNewLength;
    this._length = aNewLength;
    this._front = 0;
    this._count = Math.min(this._count, aNewLength);
    this._back = this._nextIndex(this._count - 1);
  },

  /**
   * Reads indexed data and returns it
   * If no index is specified, reads data from the front and returns it
   */
  read: function CircularBuffer_read(aIndex) {
    var index = aIndex || 0;
    
    // Adjust the index to imitate python-style indexing 
    if (index >= 0) {
      index = (this._front + index) % this._length;
    }
    else {
      index = (this._back + index) % this._length;
      if (index < 0) {
        index += this._length;
      }
    }

    var data = this._buffer[index];

    return data;
  },

  /**
   * Appends data to the front of the buffer
   * Also decrements the head index 
   */
  unshift: function CircularBuffer_unshift(aData) {
    if (this.isFull()) {
      this._back = this._prevIndex(this._back);
    }
    else {
      this._count += 1;
    }

    this._front = this._prevIndex(this._front);
    this._buffer[this._front] = aData;
    this._emit(ON_WRITE, aData);
  },
  
  /**
   * Reads data from the front, removes it, and returns it
   */
  shift: function CircularBuffer_shift() {
    var data = this.read(0);

    if (typeof(data) === 'undefined') {
      return undefined;
    }

    if (!this.isEmpty()) {
      this._count -= 1;
    }
    
    this._buffer[this._front] = undefined;
    this._front = this._nextIndex(this._front);
    this._emit(ON_REMOVE);
    
    return data;
  },
  
  /**
   * Writes data to the back of the buffer
   */
  push: function CircularBuffer_push(aData) {
    if (this.isFull()) {
      this._front = this._nextIndex(this._front);
    }
    else {
      this._count += 1;
    }
    
    this._buffer[this._back] = aData;
    this._back = this._nextIndex(this._back);
    this._emit(ON_WRITE, aData);
  },

  /** 
   * Reads data from the back, removes it, and returns it
   */
  pop: function CircularBuffer_pop() {
    var data = this.read(-1);

    if (typeof(data) === 'undefined') {
      return undefined;
    }

    if (!this.isEmpty()) {
      this._count -= 1;
    }
    
    this._buffer[this._prevIndex(this._back)] = undefined;
    this._back = this._prevIndex(this._back);
    this._emit(ON_REMOVE);
    
    return data;
  },
  
  /**
   * Clears data from the buffer and resets the count
   */
  clear: function CircularBuffer_clear() {
    this._buffer.length = 0;
    this._buffer.length = this._length;
    this._front = 0;
    this._back = 0;
    this._count = 0;
    this._emit(ON_REMOVE);
  },

  isEmpty: function CircularBuffer_isEmpty() {
    return (this._count === 0);
  },
  
  isFull: function CircularBuffer_isFull() {
    return (this._count === this._length);
  }
});

exports.CircularBuffer = buffer;
