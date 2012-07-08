var fs = require('fs'),
    util = require('util'),
    BufferExtender = require('./Buffer');

/**
 * Represents an image with Exif information. When instantiating it you have to
 * provide an image and a callback function which is called once all metadata 
 * is extracted from the image.
 * 
 * Available options are:
 *  - image The image to get Exif data from can be either a filesystem path or
 *          a Buffer.
 * 
 * @param options Configuration options as described above
 * @param callback Function to call when data is extracted or an error occured 
 * @return Nothing of importance, calls the specified callback function instead
 */
function ExifImage (options, callback) {
	
	var self = this;
	
	if (!options) 
		var options = {};
	
	this.image;
	this.imageType;
	this.isBigEndian;
	
	this.exifData = {
		image : [],									// Information about the main image
		thumbnail : [],								// Information about the thumbnail
		exif : [],									// Exif information
		gps : [],									// GPS information
		interoperability: [],						// Exif Interoperability information
		makernote : []								// Makernote information
	};
	
	if (!options.image) {
		throw 'You have to provide an image, it is pretty hard to extract Exif data from nothing...';
	} else if (typeof callback !== 'function') {
		throw 'You have to provide a callback function.';
	} else {
		this.loadImage(options.image, function (error, image) {
			if (error) 
				callback(error);
			else
				callback(false, image);
		});
	}
	
}

module.exports = ExifImage;

ExifImage.prototype.loadImage = function (image, callback) {
	
	var self = this;
	
	if (image.constructor.name === 'Buffer') {
		
		this.processImage(image, callback);
		
	} else if (image.constructor.name === 'String') {
		
		rawData = fs.readFile(image, function (error, data) {
			if (error)
				callback({ message : 'Encountered the following error while trying to read given image: '+error });
			else
				self.processImage(data, callback);
		});
		
	} else {
		
		callback({ message : 'Given image is neither a buffer nor a file, please provide one of these.' });

	}

}

ExifImage.prototype.processImage = function (data, callback) {
	
	var self = this;
	var offset = 0;
	
	if (data[offset++] == 0xFF && data[offset++] == 0xD8) {
		self.imageType = 'JPEG';
	} else {
		callback({ message : 'The given image is not a JPEG and thus unsupported right now.' });
		return;
	}
	
	while (offset < data.length) {
		
		if (data[offset++] != 0xFF) {
			callback({ message : 'Invalid marker found at offset '+(--offset)+'. Expected 0xFF but found 0x'+data[offset].toString(16).toUpperCase() });
			return;
		}
		
		if (data[offset++] == 0xE1) {
			self.extractExifData(data, offset + 2, data.getShort(offset, true) - 2, callback);
			return;
		} else {
			offset += data.getShort(offset, true);
		}
		
	}
	
	callback({ message : 'No Exif segment found in the given image' });
	
}

ExifImage.prototype.extractExifData = function (data, start, length, callback) {

	var self = this;
	var tiffOffset = start + 6;
	var ifdOffset, numberOfEntries;
	
	// Exif data always starts with Exif\0\0
	if (data.toString('utf8', start, tiffOffset) != 'Exif\0\0') {
		callback({ message : 'The Exif data ist not valid.' });
		return;
	}
	
	// After the Exif start we either have 0x4949 if the following data is 
	// stored in big endian or 0x4D4D if it is stored in little endian
	if (data.getShort(tiffOffset) == 0x4949) {
		this.isBigEndian = false;
	} else if (data.getShort(tiffOffset) == 0x4D4D) {
		this.isBigEndian = true;
	} else {
		callback({ message : 'Invalid TIFF data! Expected 0x4949 or 0x4D4D at offset '+(tiffOffset)+' but found 0x'+data[tiffOffset].toString(16).toUpperCase()+data[tiffOffset + 1].toString(16).toUpperCase() });
		return;
	}
	
	// Valid TIFF headers always have 0x002A here
    if (data.getShort(tiffOffset + 2, this.isBigEndian) != 0x002A) {
    	var expected = (this.isBigEndian) ? '0x002A' : '0x2A00';
    	callback({ message : 'Invalid TIFF data! Expected '+expected+' at offset '+(tiffOffset + 2)+' but found 0x'+data[tiffOffset + 2].toString(16).toUpperCase()+data[tiffOffset + 3].toString(16).toUpperCase() });
    	return;
    }
    
    /********************************* IFD0 **********************************/
    
    // Offset to IFD0 which is always followed by two bytes with the amount of
    // entries in this IFD
	ifdOffset = tiffOffset + data.getLong(tiffOffset + 4, this.isBigEndian);
	numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
	
	if (numberOfEntries>20){
		return callback({ message : 'Number of entries greater than expected: ' + numberOfEntries + '. Invalid EXIF?'});	
	}
	
	// Each IFD entry consists of 12 bytes which we loop through and extract
	// the data from
	for (var i = 0; i < numberOfEntries; i++) {
		var exifEntry = self.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.tiff);
		if (exifEntry) this.exifData.image.push(exifEntry);			
	}
	
	/********************************* IFD1 **********************************/
	
    // Check if there is an offset for IFD1. If so it is always followed by two
	// bytes with the amount of entries in this IFD, if not there is no IFD1
    ifdOffset = tiffOffset + data.getLong(ifdOffset + 2 + (numberOfEntries * 12), this.isBigEndian);
	if (ifdOffset != 0x00000000) {
		numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
		
		if (numberOfEntries>20){
			return callback({ message : 'Number of entries greater than expected: ' + numberOfEntries + '. Invalid EXIF?'});	
		}
		
		// Each IFD entry consists of 12 bytes which we loop through and extract
		// the data from
		for (var i = 0; i < numberOfEntries; i++) {
			var exifEntry = self.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.tiff);
			if (exifEntry) this.exifData.thumbnail.push(exifEntry);
		}
	}
	
	/******************************* EXIF IFD ********************************/

	// Look for a pointer to the Exif IFD in IFD0 and extract information from
	// it if available
	for (exifEntry in this.exifData.image) {
		if (this.exifData.image[exifEntry].tag.getShort(0, this.isBigEndian) == 0x8769) {
			ifdOffset = tiffOffset + this.exifData.image[exifEntry].value;
			numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);

			// Each IFD entry consists of 12 bytes which we loop through and extract
			// the data from
			for (var i = 0; i < numberOfEntries; i++) {
				var exifEntry = self.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.exif);
				if (exifEntry) this.exifData.exif.push(exifEntry);
			}
			
			break;
		}
	}
	
	/******************************** GPS IFD ********************************/
	
	// Look for a pointer to the GPS IFD in IFD0 and extract information from
	// it if available
	for (exifEntry in this.exifData.image) {
		if (this.exifData.image[exifEntry].tag.getShort(0, this.isBigEndian) == 0x8825) {
			ifdOffset = tiffOffset + this.exifData.image[exifEntry].value;
			numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
			
			// Each IFD entry consists of 12 bytes which we loop through and extract
			// the data from
			for (var i = 0; i < numberOfEntries; i++) {
				var exifEntry = self.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.gps);
				if (exifEntry) this.exifData.gps.push(exifEntry);
			}
			
			break;
		}
	}
	
	/************************* Interoperability IFD **************************/

	// Look for a pointer to the interoperatbility IFD in the Exif IFD and 
	// extract information from it if available
	for (exifEntry in this.exifData.exif) {
		if (this.exifData.exif[exifEntry].tag.getShort(0, this.isBigEndian) == 0xA005) {
			ifdOffset = tiffOffset + this.exifData.exif[exifEntry].value;
			numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
			
			// Each IFD entry consists of 12 bytes which we loop through and extract
			// the data from
			for (var i = 0; i < numberOfEntries; i++) {
				var exifEntry = self.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian);
				if (exifEntry) this.exifData.interoperability.push(exifEntry);
			}
			
			break;
		}
	}
	
	/***************************** Makernote IFD *****************************/
	
	// Look for Makernote data in the Exif IFD, check which type of proprietary
	// Makernotes the image contains, load the respective functionality and 
	// start the extraction
	for (exifEntry in this.exifData.exif) {
		if (this.exifData.exif[exifEntry].tag.getShort(0, this.isBigEndian) == 0x927C) {
			
			// Check the header to see what kind of Makernote we are dealing with
			if (this.exifData.exif[exifEntry].value.getString(0, 7) === "OLYMP\x00\x01") {
				this.extractMakernotes = require('./makernotes/olympus').extractMakernotes;
			} else if (this.exifData.exif[exifEntry].value.getString(0, 7) === "AGFA \x00\x01") {
				this.extractMakernotes = require('./makernotes/agfa').extractMakernotes;
			} else if (this.exifData.exif[exifEntry].value.getString(0, 8) === "EPSON\x00\x01\x00") {
				this.extractMakernotes = require('./makernotes/epson').extractMakernotes;
			} else {
				// Makernotes are available but the format is not recognized so
				// an error message is pushed instead, this ain't the best 
				// solution but should do for now
				this.exifData.makernote.push({ error: 'Unable to extract Makernote information as it is in an unrecognized format.' });
				break;
			}
			
			this.exifData.makernote = this.extractMakernotes(data, this.exifData.exif[exifEntry].valueOffset, tiffOffset);
			
		}
	}

	callback(false, this.exifData);
	
}

ExifImage.prototype.extractExifEntry = function (data, entryOffset, tiffOffset, isBigEndian, tags) {
	
	var entry = { 
		tag : data.slice(entryOffset, entryOffset + 2),
	    format : data.getShort(entryOffset + 2, isBigEndian),
	    components : data.getLong(entryOffset + 4, isBigEndian),
	    valueOffset: null,
	    value : []
	}
	
	entry.tagName = (tags && tags[entry.tag.getShort(0, isBigEndian)]) ? tags[entry.tag.getShort(0, isBigEndian)] : null;
	
	switch (entry.format) {
	
		case 0x0001: // unsigned byte, 1 byte per component
			entry.valueOffset = (entry.components <= 4) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
			for (var i = 0; i < entry.components; i++)
				entry.value.push(data.getByte(entry.valueOffset + i));
			break;

		case 0x0002: // ascii strings, 1 byte per component
			entry.valueOffset = (entry.components <= 4) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
			entry.value = data.getString(entry.valueOffset, entry.components);
			if (entry.value[entry.value.length - 1] === "\u0000") // Trim null terminated strings
				entry.value = entry.value.substring(0, entry.value.length - 1); 
			break;

		case 0x0003: // unsigned short, 2 byte per component
			entry.valueOffset = (entry.components <= 2) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
			for (var i = 0; i < entry.components; i++)
				entry.value.push(data.getShort(entry.valueOffset + i * 2, isBigEndian));
			break;

		case 0x0004: // unsigned long, 4 byte per component
			entry.valueOffset = (entry.components == 1) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
			for (var i = 0; i < entry.components; i++)
				entry.value.push(data.getLong(entry.valueOffset + i * 4, isBigEndian));
			break;
			
		case 0x0005: // unsigned rational, 8 byte per component (4 byte numerator and 4 byte denominator)
			entry.valueOffset = data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
			for (var i = 0; i < entry.components; i++)
				entry.value.push(data.getLong(entry.valueOffset, isBigEndian) / data.getLong(entry.valueOffset + 4, isBigEndian));
			break;
			
		case 0x0006: // signed byte, 1 byte per component
			entry.valueOffset = (entry.components <= 4) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
			for (var i = 0; i < entry.components; i++)
				entry.value.push(data.getSignedByte(entry.valueOffset + i));
			break;
			
		case 0x0007: // undefined, 1 byte per component
			entry.valueOffset = (entry.components <= 4) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
			entry.value.push(data.slice(entry.valueOffset, entry.valueOffset + entry.components));
			break;

		case 0x0008: // signed short, 2 byte per component
			entry.valueOffset = (entry.components <= 2) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
			for (var i = 0; i < entry.components; i++)
				entry.value.push(data.getSignedShort(entry.valueOffset + i * 2, isBigEndian));
			break;

		case 0x0009: // signed long, 4 byte per component
			entry.valueOffset = (entry.components == 1) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
			for (var i = 0; i < entry.components; i++)
				entry.value.push(data.getSignedLong(entry.valueOffset + i * 4, isBigEndian));
			break;
			
		case 0x000A: // signed rational, 8 byte per component (4 byte numerator and 4 byte denominator)
			entry.valueOffset = data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
			for (var i = 0; i < entry.components; i++)
				entry.value.push(data.getSignedLong(entry.valueOffset, isBigEndian) / data.getSignedLong(entry.valueOffset + 4, isBigEndian));
			break;

		default:
			return false;
	
	}
	
	// If the value array has only one element we don't need an array
	if (entry.value.length == 1) entry.value = entry.value[0];
	
	return entry;
	
}

/**
 * Comprehensive list of TIFF and Exif tags collected from around the web.  
 */
ExifImage.TAGS = {

	exif : {
	
		// Exif Tags	
		0x829A : 'ExposureTime',
		0x829D : 'FNumber',
		0x8822 : 'ExposureProgram',
		0x8824 : 'SpectralSensitivity',
		0x8827 : 'ISOSpeedRatings',
		0x8828 : 'OECF',
		0x9000 : 'ExifVersion',
		0x9003 : 'DateTimeOriginal',
		0x9004 : 'DateTimeDigitized',
		0x9101 : 'ComponentsConfiguration',
		0x9102 : 'CompressedBitsPerPixel',
		0x9201 : 'ShutterSpeedValue',
		0x9202 : 'ApertureValue',
		0x9203 : 'BrightnessValue',
		0x9204 : 'ExposureBiasValue',
		0x9205 : 'MaxApertureValue',
		0x9206 : 'SubjectDistance',
		0x9207 : 'MeteringMode',
		0x9208 : 'LightSource',
		0x9209 : 'Flash',
		0x920A : 'FocalLength',
		0x9214 : 'SubjectArea',
		0x927C : 'MakerNote',
		0x9286 : 'UserComment',
		0x9290 : 'SubsecTime',
		0x9291 : 'SubsecTimeOriginal',
		0x9292 : 'SubsecTimeDigitized',
		0xA000 : 'FlashpixVersion',
		0xA001 : 'ColorSpace',
		0xA002 : 'PixelXDimension',
		0xA003 : 'PixelYDimension',
		0xA004 : 'RelatedSoundFile',
		0xA005 : 'Interoperability IFD',
		0xA20B : 'FlashEnergy',
		0xA20C : 'SpatialFrequencyResponse',
		0xA20E : 'FocalPlaneXResolution',
		0xA20F : 'FocalPlaneYResolution',
		0xA210 : 'FocalPlaneResolutionUnit',
		0xA214 : 'SubjectLocation',
		0xA215 : 'ExposureIndex',
		0xA217 : 'SensingMethod',
		0xA300 : 'FileSource',
		0xA301 : 'SceneType',
		0xA302 : 'CFAPattern',
		0xA401 : 'CustomRendered',
		0xA402 : 'ExposureMode',
		0xA403 : 'WhiteBalance',
		0xA404 : 'DigitalZoomRatio',
		0xA405 : 'FocalLengthIn35mmFilm',
		0xA406 : 'SceneCaptureType',
		0xA407 : 'GainControl',
		0xA408 : 'Contrast',
		0xA409 : 'Saturation',
		0xA40A : 'Sharpness',
		0xA40B : 'DeviceSettingDescription',
		0xA40C : 'SubjectDistanceRange',
		0xA420 : 'ImageUniqueID',
		
	},
	
	tiff : {
	
		// Baseline TIFF Tags
		0x00FE : 'NewSubfileType',
		0x00FF : 'SubfileType',
		0x0100 : 'ImageWidth',
		0x0101 : 'ImageLength',
		0x0102 : 'BitsPerSample',
		0x0103 : 'Compression',
		0x0106 : 'PhotometricInterpretation',
		0x0107 : 'Threshholding',
		0x0108 : 'CellWidth',
		0x0109 : 'CellLength',
		0x010A : 'FillOrder',
		0x010E : 'ImageDescription',
		0x010F : 'Make',
		0x0110 : 'Model',
		0x0111 : 'StripOffsets',
		0x0112 : 'Orientation',
		0x0115 : 'SamplesPerPixel',
		0x0116 : 'RowsPerStrip',
		0x0117 : 'StripByteCounts',
		0x0118 : 'MinSampleValue',
		0x0119 : 'MaxSampleValue',
		0x011A : 'XResolution',
		0x011B : 'YResolution',
		0x011C : 'PlanarConfiguration',
		0x0120 : 'FreeOffsets',
		0x0121 : 'FreeByteCounts',
		0x0122 : 'GrayResponseUnit',
		0x0123 : 'GrayResponseCurve',
		0x0128 : 'ResolutionUnit',
		0x0131 : 'Software',
		0x0132 : 'DateTime',
		0x013B : 'Artist',
		0x013C : 'HostComputer',
		0x0140 : 'ColorMap',
		0x0152 : 'ExtraSamples',
		0x8298 : 'Copyright',

		// Extension TIFF Tags
		0x010D : 'DocumentName',
		0x011D : 'PageName',
		0x011E : 'XPosition',
		0x011F : 'YPosition',
		0x0124 : 'T4Options',
		0x0125 : 'T6Options',
		0x0129 : 'PageNumber',
		0x012D : 'TransferFunction',
		0x013D : 'Predictor',
		0x013E : 'WhitePoint',
		0x013F : 'PrimaryChromaticities',
		0x0141 : 'HalftoneHints',
		0x0142 : 'TileWidth',
		0x0143 : 'TileLength',
		0x0144 : 'TileOffsets',
		0x0145 : 'TileByteCounts',
		0x0146 : 'BadFaxLines',
		0x0147 : 'CleanFaxData',
		0x0148 : 'ConsecutiveBadFaxLines',
		0x014A : 'SubIFDs',
		0x014C : 'InkSet',
		0x014D : 'InkNames',
		0x014E : 'NumberOfInks',
		0x0150 : 'DotRange',
		0x0151 : 'TargetPrinter',
		0x0153 : 'SampleFormat',
		0x0154 : 'SMinSampleValue',
		0x0155 : 'SMaxSampleValue',
		0x0156 : 'TransferRange',
		0x0157 : 'ClipPath',
		0x0158 : 'XClipPathUnits',
		0x0159 : 'YClipPathUnits',
		0x015A : 'Indexed',
		0x015B : 'JPEGTables',
		0x015F : 'OPIProxy',
		0x0190 : 'GlobalParametersIFD',
		0x0191 : 'ProfileType',
		0x0192 : 'FaxProfile',
		0x0193 : 'CodingMethods',
		0x0194 : 'VersionYear',
		0x0195 : 'ModeNumber',
		0x01B1 : 'Decode',
		0x01B2 : 'DefaultImageColor',
		0x0200 : 'JPEGProc',
		0x0201 : 'JPEGInterchangeFormat',
		0x0202 : 'JPEGInterchangeFormatLength',
		0x0203 : 'JPEGRestartInterval',
		0x0205 : 'JPEGLosslessPredictors',
		0x0206 : 'JPEGPointTransforms',
		0x0207 : 'JPEGQTables',
		0x0208 : 'JPEGDCTables',
		0x0209 : 'JPEGACTables',
		0x0211 : 'YCbCrCoefficients',
		0x0212 : 'YCbCrSubSampling',
		0x0213 : 'YCbCrPositioning',
		0x0214 : 'ReferenceBlackWhite',
		0x022F : 'StripRowCounts',
		0x02BC : 'XMP',
		0x800D : 'ImageID',
		0x87AC : 'ImageLayer',
	
		// Private TIFF Tags
		0x80A4 : 'Wang Annotation',
		0x82A5 : 'MD FileTag',
		0x82A6 : 'MD ScalePixel',
		0x82A7 : 'MD ColorTable',
		0x82A8 : 'MD LabName',
		0x82A9 : 'MD SampleInfo',
		0x82AA : 'MD PrepDate',
		0x82AB : 'MD PrepTime',
		0x82AC : 'MD FileUnits',
		0x830E : 'ModelPixelScaleTag',
		0x83BB : 'IPTC',
		0x847E : 'INGR Packet Data Tag',
		0x847F : 'INGR Flag Registers',
		0x8480 : 'IrasB Transformation Matrix',
		0x8482 : 'ModelTiepointTag',
		0x85D8 : 'ModelTransformationTag',
		0x8649 : 'Photoshop',
		0x8769 : 'Exif IFD',
		0x8773 : 'ICC Profile',
		0x87AF : 'GeoKeyDirectoryTag',
		0x87B0 : 'GeoDoubleParamsTag',
		0x87B1 : 'GeoAsciiParamsTag',
		0x8825 : 'GPS IFD',
		0x885C : 'HylaFAX FaxRecvParams',
		0x885D : 'HylaFAX FaxSubAddress',
		0x885E : 'HylaFAX FaxRecvTime',
		0x935C : 'ImageSourceData',
		0xA005 : 'Interoperability IFD',
		0xA480 : 'GDAL_METADATA',
		0xA481 : 'GDAL_NODATA',
		0xC427 : 'Oce Scanjob Description',
		0xC428 : 'Oce Application Selector',
		0xC429 : 'Oce Identification Number',
		0xC42A : 'Oce ImageLogic Characteristics',
		0xC612 : 'DNGVersion',
		0xC613 : 'DNGBackwardVersion',
		0xC614 : 'UniqueCameraModel',
		0xC615 : 'LocalizedCameraModel',
		0xC616 : 'CFAPlaneColor',
		0xC617 : 'CFALayout',
		0xC618 : 'LinearizationTable',
		0xC619 : 'BlackLevelRepeatDim',
		0xC61A : 'BlackLevel',
		0xC61B : 'BlackLevelDeltaH',
		0xC61C : 'BlackLevelDeltaV',
		0xC61D : 'WhiteLevel',
		0xC61E : 'DefaultScale',
		0xC61F : 'DefaultCropOrigin',
		0xC620 : 'DefaultCropSize',
		0xC621 : 'ColorMatrix1',
		0xC622 : 'ColorMatrix2',
		0xC623 : 'CameraCalibration1',
		0xC624 : 'CameraCalibration2',
		0xC625 : 'ReductionMatrix1',
		0xC626 : 'ReductionMatrix2',
		0xC627 : 'AnalogBalance',
		0xC628 : 'AsShotNeutral',
		0xC629 : 'AsShotWhiteXY',
		0xC62A : 'BaselineExposure',
		0xC62B : 'BaselineNoise',
		0xC62C : 'BaselineSharpness',
		0xC62D : 'BayerGreenSplit',
		0xC62E : 'LinearResponseLimit',
		0xC62F : 'CameraSerialNumber',
		0xC630 : 'LensInfo',
		0xC631 : 'ChromaBlurRadius',
		0xC632 : 'AntiAliasStrength',
		0xC634 : 'DNGPrivateData',
		0xC635 : 'MakerNoteSafety',
		0xC65A : 'CalibrationIlluminant1',
		0xC65B : 'CalibrationIlluminant2',
		0xC65C : 'BestQualityScale',
		0xC660 : 'Alias Layer Metadata',

	},
	
	gps : {
		
		// GPS Tags
		0x0000 : 'GPSVersionID',
		0x0001 : 'GPSLatitudeRef',
		0x0002 : 'GPSLatitude',
		0x0003 : 'GPSLongitudeRef',
		0x0004 : 'GPSLongitude',
		0x0005 : 'GPSAltitudeRef',
		0x0006 : 'GPSAltitude',
		0x0007 : 'GPSTimeStamp',
		0x0008 : 'GPSSatellites',
		0x0009 : 'GPSStatus',
		0x000A : 'GPSMeasureMode',
		0x000B : 'GPSDOP',
		0x000C : 'GPSSpeedRef',
		0x000D : 'GPSSpeed',
		0x000E : 'GPSTrackRef',
		0x000F : 'GPSTrack',
		0x0010 : 'GPSImgDirectionRef',
		0x0011 : 'GPSImgDirection',
		0x0012 : 'GPSMapDatum',
		0x0013 : 'GPSDestLatitudeRef',
		0x0014 : 'GPSDestLatitude',
		0x0015 : 'GPSDestLongitudeRef',
		0x0016 : 'GPSDestLongitude',
		0x0017 : 'GPSDestBearingRef',
		0x0018 : 'GPSDestBearing',
		0x0019 : 'GPSDestDistanceRef',
		0x001A : 'GPSDestDistance',
		0x001B : 'GPSProcessingMethod',
		0x001C : 'GPSAreaInformation',
		0x001D : 'GPSDateStamp',
		0x001E : 'GPSDifferential',
		
	}
	
}