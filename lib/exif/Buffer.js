//
// A couple of methods that make working with buffers more easy.
//

Buffer.prototype.getByte = function (offset) {
	return this[offset]; 
}

Buffer.prototype.getSignedByte = function (offset) {
	return (this[offset] > 127) ? this[offset] - 256 : this[offset]; 
}

Buffer.prototype.getShort = function (offset, bigEndian) {
	var short = (bigEndian) ? (this[offset] << 8) + this[offset + 1] : (this[offset + 1] << 8) + this[offset]; 
	return (short < 0) ? short + 65536 : short;
}

Buffer.prototype.getSignedShort = function (offset, bigEndian) {
	var short = (bigEndian) ? (this[offset] << 8) + this[offset + 1] : (this[offset + 1] << 8) + this[offset]; 
	return (short > 32767) ? short - 65536 : short;
}

Buffer.prototype.getLong = function (offset, bigEndian) {
	var long = (bigEndian) ? (((((this[offset] << 8) + this[offset + 1]) << 8) + this[offset + 2]) << 8) + this[offset + 3] : (((((this[offset + 3] << 8) + this[offset + 2]) << 8) + this[offset + 1]) << 8) + this[offset]; 
	return (long < 0) ? long + 4294967296 : long;
}

Buffer.prototype.getSignedLong = function (offset, bigEndian) {
	var long = (bigEndian) ? (((((this[offset] << 8) + this[offset + 1]) << 8) + this[offset + 2]) << 8) + this[offset + 3] : (((((this[offset + 3] << 8) + this[offset + 2]) << 8) + this[offset + 1]) << 8) + this[offset]; 
	return (long > 2147483647) ? long - 4294967296 : long;
}

Buffer.prototype.getString = function (offset, length) {
	var string = [];
	for (var i = offset; i < offset + length; i++)
		string.push(String.fromCharCode(this[i]));
    return string.join('');
}