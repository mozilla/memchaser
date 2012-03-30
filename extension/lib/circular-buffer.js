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

    this._buffer = [];
    this._buffer.length = aOptions.length || 60;
    this._front = 0;
    this._back = 0;
    this._count = 0;
    
    // Report unhandled errors from listeners
    this.on('error', console.exception.bind(console));

    // Make sure we clean-up correctly
    unload.ensure(this, 'unload');
  },

  /**
   * Destructor; to be called only once
   */
  unload: function CircularBuffer_unload() {
    this._removeAllListeners(ON_WRITE);
    this._removeAllListeners(ON_REMOVE);
  },

  /**
   * Returns the next index, adjusted for cycles
   */
  _nextIndex: function CircularBuffer_nextIndex(aIndex) {
    return (aIndex + 1) % this.length;
  },

  /**
   * Returns the previous index, adjusted for cycles
   */
  _prevIndex: function CircularBuffer_prevIndex(aIndex) {
    var index = (aIndex - 1) % this.length;

    if (index < 0) {
      index += this.length;
    }
    return index;
  },

  /**
   * Normalize the circular buffer as a FIFO buffer;
   * The buffer is reorganized such that the head is pointing
   * to the 0th element and the back to the number of elements
   */
  _normalize: function CircularBuffer_normalize() {
    var temp = this.length;

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

    this._buffer = this._buffer.slice(0, temp);
    this._front = 0;
    this._back = this.count;
  },

  /**
   * Returns the number of elements currently in the buffer
   */
  get count() {
    return this._count;
  },
  
  set count(val) {
    this._count = val;
  },

  /**
   * Returns the capacity of the array;
   * The capacity indicates the number of elements are in a full buffer
   */
  get length() {
    return this._buffer.length;
  },

  set length(aNewLength) {
    if (aNewLength < 0) {
      throw new RangeError('Invalid length');
    }

    this._normalize();

    // Truncate the oldest elements if new length is less than original
    if (aNewLength < this.length) {
      this._buffer = this._buffer.slice(this.length - aNewLength);
    }

    this._buffer.length = aNewLength;
    this.count = Math.min(this.count, aNewLength);
    this._back = this._nextIndex(this.count - 1);
  },

  /**
   * Reads indexed data and returns it
   * If no index is specified, reads data from the front and returns it
   */
  read: function CircularBuffer_read(aIndex) {
    var index = aIndex || 0;
    
    // Adjust the index to imitate python-style indexing 
    if (index >= 0) {
      index = (this._front + index) % this.length;
    }
    else {
      index = (this._back + index) % this.length;
      if (index < 0) {
        index += this.length;
      }
    }

    var data = this._buffer[index];

    return data;
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
      this.count -= 1;
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
      this.count += 1;
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
      this.count -= 1;
    }
    
    this._buffer[this._prevIndex(this._back)] = undefined;
    this._back = this._prevIndex(this._back);
    this._emit(ON_REMOVE);
    
    return data;
  },
  
  /**
   * Returns a copy of a portion of the buffer
   * The usage follows exactly that of Array.prototype.slice
   * NOTE: The objects are copied by reference!
   */
  slice: function CircularBuffer_slice(begin, end) {
    this._normalize();

    return Array.prototype.slice.apply(this._buffer, arguments);
  },

  /**
   * Clears data from the buffer and resets the count
   */
  clear: function CircularBuffer_clear() {
    this._buffer = new Array(this.length);
    this._front = 0;
    this._back = 0;
    this.count = 0;
    this._emit(ON_REMOVE);
  },

  /**
   * Returns true to indicate that the buffer is empty
   */
  isEmpty: function CircularBuffer_isEmpty() {
    return (this.count === 0);
  },
  
  /**
   * Returns true to indicate that the buffer is full
   */
  isFull: function CircularBuffer_isFull() {
    return (this.count === this.length);
  }
});

exports.CircularBuffer = buffer;
