//
// A couple of methods that make working with buffers more easy.
//

Buffer.prototype.getByte = function (offset) {
  return this[offset];
};

Buffer.prototype.getSignedByte = function (offset) {
  return (this[offset] > 127) ? this[offset] - 256 : this[offset];
};

Buffer.prototype.getShort = function (offset, bigEndian) {
  var shortVal = (bigEndian) ? (this[offset] << 8) + this[offset + 1] : (this[offset + 1] << 8) + this[offset];
  return (shortVal < 0) ? shortVal + 65536 : shortVal;
};

Buffer.prototype.getSignedShort = function (offset, bigEndian) {
  var shortVal = (bigEndian) ? (this[offset] << 8) + this[offset + 1] : (this[offset + 1] << 8) + this[offset];
  return (shortVal > 32767) ? shortVal - 65536 : shortVal;
};

Buffer.prototype.getLong = function (offset, bigEndian) {
  var longVal = (bigEndian) ? (((((this[offset] << 8) + this[offset + 1]) << 8) + this[offset + 2]) << 8) + this[offset + 3] : (((((this[offset + 3] << 8) + this[offset + 2]) << 8) + this[offset + 1]) << 8) + this[offset];
  return (longVal < 0) ? longVal + 4294967296 : longVal;
};

Buffer.prototype.getSignedLong = function (offset, bigEndian) {
  var longVal = (bigEndian) ? (((((this[offset] << 8) + this[offset + 1]) << 8) + this[offset + 2]) << 8) + this[offset + 3] : (((((this[offset + 3] << 8) + this[offset + 2]) << 8) + this[offset + 1]) << 8) + this[offset];
  return (longVal > 2147483647) ? longVal - 4294967296 : longVal;
};

Buffer.prototype.getString = function (offset, length) {
  var string = [];
  for (var i = offset; i < offset + length; i++) {
    string.push(String.fromCharCode(this[i]));
  }
  return string.join('');
};