/**
 * Extracts Epson flavored Makernotes which are equal to those of Olympus.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {
	
	var makernoteData = [];
	
	// List of vendor specific Makernote tags found on 
	// http://www.ozhiker.com/electronics/pjmt/jpeg_info/makernotes.html 
	var tags = {

		0x0000 : 'Makernote Version', 
		0x0001 : 'Camera Settings',
		0x0003 : 'Camera Settings',
		0x0040 : 'Compressed Image Size',
		0x0081 : 'Minolta Thumbnail Offset',
		0x0088 : 'Minolta Thumbnail Offset',
		0x0089 : 'Minolta Thumbnail Length',
		0x0101 : 'Colour Mode',
		0x0102 : 'Image Quality',
		0x0103 : 'Image Quality',
		0x0200 : 'Special Mode',
		0x0201 : 'JPEG Quality',
		0x0202 : 'Macro',
		0x0204 : 'Digital Zoom',
		0x0207 : 'Firmware Version',
		0x0208 : 'Picture Info Data',   
		0x0209 : 'Camera ID',
		0x020B : 'Image Width',
		0x020C : 'Image Height',
		0x020D : 'Original Manufacturer Model',
		0x0E00 : 'Print Image Matching Info	PIM',
		0x1004 : 'Flash Mode',
		0x1006 : 'Bracket',
		0x100B : 'Focus Mode',
		0x100C : 'Focus Distance',
		0x100D : 'Zoom	Numeric',  
		0x100E : 'Macro Focus',
		0x100F : 'Sharpness	Numeric',
		0x1011 : 'Colour Matrix',
		0x1012 : 'Black Level',
		0x1015 : 'White Balance',   
		0x1017 : 'Red Bias',
		0x1018 : 'Blue Bias',
		0x101A : 'Serial Number',
		0x1023 : 'Flash Bias',
		0x1029 : 'Contrast',
		0x102A : 'Sharpness Factor',
		0x102B : 'Colour Control',  
		0x102C : 'Valid Bits',
		0x102D : 'Coring Filter',
		0x102E : 'Final Width',
		0x102F : 'Final Height',
		0x1034 : 'Compression Ratio',
			
	};
	
	// Epson flavored Makernote data starts after eight bytes
	var ifdOffset = makernoteOffset + 8;
	
	// Get the number of entries and extract them
	var numberOfEntries = data.getShort(ifdOffset, this.isBigEndian, tiffOffset);
	
	for (var i = 0; i < numberOfEntries; i++) {
		var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, tags);
		if (exifEntry) makernoteData.push(exifEntry);
	}
	
	return makernoteData;
	
};