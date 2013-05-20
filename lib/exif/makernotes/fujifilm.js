/**
 * Extracts Fujifilm flavored Makernotes which are always stored in little 
 * endian, no matter what the rest of the file is. Additionally the offsets
 * are relative to the start of the Makernote instead of the start of the 
 * TIFF header.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {

	var makernoteData = [];
	
	// List of vendor specific Makernote tags
	var tags = {

		0x0000 : 'Version',	  
		0x1000 : 'Quality',	  
		0x1001 : 'Sharpness',
		0x1002 : 'White Balance',
		0x1010 : 'Flash Mode',
		0x1011 : 'Flash Strength', 
		0x1020 : 'Macro',
		0x1021 : 'Focus Mode',
		0x1030 : 'Slow Sync',
		0x1031 : 'Picture Mode',
		0x1100 : 'Auto bracketing',
		0x1300 : 'Blur Warning',
		0x1301 : 'Focus warning',
		0x1302 : 'Auto Exposure Warning',
			
	};
	
	// Start of the Fujifilm flavored Makernote data is determined by the four
	// bytes following the Makernote vendor name
	var ifdOffset = makernoteOffset + data.getLong(makernoteOffset + 8, false, tiffOffset);

	// Get the number of entries and extract them
	var numberOfEntries = data.getShort(ifdOffset, false, tiffOffset);
	
	for (var i = 0; i < numberOfEntries; i++) {
		var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), makernoteOffset, false, tags);
		if (exifEntry) makernoteData.push(exifEntry);
	}

	return makernoteData;
	
};