var util = require('util')
var Stream = require('stream')
var StringDecoder = require('string_decoder').StringDecoder

module.exports = StringStream
module.exports.AlignedStringDecoder = AlignedStringDecoder

function StringStream(from, to) {
  if (!(this instanceof StringStream)) return new StringStream(from, to)

  Stream.call(this)

  if (from == null) from = 'utf8'

  this.readable = this.writable = true
  this.paused = false
  this.toEncoding = (to == null ? from : to)
  this.fromEncoding = (to == null ? '' : from)
  this.decoder = new AlignedStringDecoder(this.fromEncoding, this.toEncoding)
}
util.inherits(StringStream, Stream)

StringStream.prototype.write = function(data) {
  if (!this.writable) {
    var err = new Error('stream not writable')
    err.code = 'EPIPE'
    this.emit('error', err)
    return false
  }
  if (this.fromEncoding) {
    if (Buffer.isBuffer(data)) data = data.toString()
    data = new Buffer(data, this.fromEncoding)    
  }
  var string = this.decoder.write(data)
  if (string.length) this.emit('data', string)
  return !this.paused
}

StringStream.prototype.flush = function() {
  if (this.decoder.flush) {    
    var string = this.decoder.flush()
    if (string.length) this.emit('data', string)
  }
}

StringStream.prototype.end = function() {
  if (!this.writable && !this.readable) return
  this.flush()
  this.emit('end')
  this.writable = this.readable = false
  this.destroy()
}

StringStream.prototype.destroy = function() {
  this.decoder = null
  this.writable = this.readable = false
  this.emit('close')
}

StringStream.prototype.pause = function() {
  this.paused = true
}

StringStream.prototype.resume = function () {
  if (this.paused) this.emit('drain')
  this.paused = false
}

function AlignedStringDecoder(fromEncoding, toEncoding) {
  StringDecoder.call(this, toEncoding)

  this.fromEncoding = fromEncoding
  this.toEncoding = toEncoding

  switch (this.fromEncoding) {
    case 'base64':
      this.fromRemainBuffer = new Buffer(6)
      this.fromRemainBytes = 0
      break
  }

  switch (this.toEncoding) {
    case 'base64':
      this.write = alignedWrite
      this.toRemainBuffer = new Buffer(3)
      this.toRemainBytes = 0
      break
  }
}
util.inherits(AlignedStringDecoder, StringDecoder)

AlignedStringDecoder.prototype.flush = function() {

  if (this.toEncoding === 'base64') {
    if (!this.toRemainBytes) return ''
    var leftover = this.toRemainBuffer.toString(this.toEncoding, 0, this.toRemainBytes)
    this.toRemainBytes = 0
    return leftover
  } else
    return ''
}

function alignedWrite(buffer) {

  var newFromRemainBytes, newToRemainBytes, data, length

  if (this.fromEncoding === 'base64') {
    newFromRemainBytes = (this.fromRemainBytes + buffer.length) % this.fromRemainBuffer.length
    
    length = this.fromRemainBytes + buffer.length - newFromRemainBytes
    data = new Buffer(length)
      
    if (this.fromRemainBytes) {
      this.fromRemainBuffer.copy(data, 0, 0, this.fromRemainBytes)
      buffer.copy(data, this.fromRemainBytes, 0, length - this.fromRemainBytes)
    } else {
      buffer.copy(data, 0, 0, length)
    }

    if (newFromRemainBytes)
      buffer.copy(this.fromRemainBuffer, 0, length - this.fromRemainBytes)

    this.fromRemainBytes = newFromRemainBytes      
  }
  else
    data = buffer

  if (this.toEncoding === 'base64') {
    newToRemainBytes = (this.toRemainBytes + data.length) % this.toRemainBuffer.length
    
    if (!newToRemainBytes && !this.toRemainBytes)
      return data.toString(this.toEncoding)

    length = this.toRemainBytes + data.length - newToRemainBytes
    var returnBuffer = new Buffer(length)

    this.toRemainBuffer.copy(returnBuffer, 0, 0, this.toRemainBytes)
    data.copy(returnBuffer, this.toRemainBytes, 0, length - this.toRemainBytes)

    if (newToRemainBytes)
      data.copy(this.toRemainBuffer, 0, length - this.toRemainBytes)

    this.toRemainBytes = newToRemainBytes

    return returnBuffer.toString(this.toEncoding)
  }
  else
    return data.toString(this.toEncoding)
}
