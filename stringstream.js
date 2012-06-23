var util = require('util')
var Stream = require('stream')
var StringDecoder = require('string_decoder').StringDecoder

module.exports = StringStream

function StringStream(from, to) {
  if (!(this instanceof StringStream)) return new StringStream(from, to)

  Stream.call(this)

  from = from || 'utf8'

  this.readable = true
  this.writable = true
  this.toEncoding = (typeof to === 'undefined' ? from : to)
  this.fromEncoding = (typeof to === 'undefined' ? '' : from)
  this.decoder = new AlignedStringDecoder(this.toEncoding)
}
util.inherits(StringStream, Stream)

StringStream.prototype.write = function(data) {
  if (this.fromEncoding) {
    if (Buffer.isBuffer(data)) data = data.toString()
    data = new Buffer(data, this.fromEncoding)
  }
  var string = this.decoder.write(data)
  if (string.length) this.emit('data', string)
}

StringStream.prototype.end = function() {
  var string = this.decoder.flush()
  if (string.length) this.emit('data', string)
  this.emit('end')
}


function AlignedStringDecoder(encoding) {
  StringDecoder.call(this, encoding)

  switch (this.encoding) {
    case 'base64':
      this.write = alignedWrite
      this.alignedBuffer = new Buffer(3)
      this.alignedBytes = 0
      break
  }
}
util.inherits(AlignedStringDecoder, StringDecoder)

AlignedStringDecoder.prototype.flush = function() {
  if (this.alignedBuffer && this.alignedBytes) {
    return this.alignedBuffer.toString(this.encoding, 0, this.alignedBytes)
  } else {
    return ''
  }
}

function alignedWrite(buffer) {
  var rem = (this.alignedBytes + buffer.length) % this.alignedBuffer.length
  if (!rem && !this.alignedBytes) return buffer.toString(this.encoding)

  var returnBuffer = new Buffer(this.alignedBytes + buffer.length - rem)

  this.alignedBuffer.copy(returnBuffer, 0, 0, this.alignedBytes)
  buffer.copy(returnBuffer, this.alignedBytes, 0, buffer.length - rem)

  buffer.copy(this.alignedBuffer, 0, buffer.length - rem, buffer.length)
  this.alignedBytes = rem

  return returnBuffer.toString(this.encoding)
}
