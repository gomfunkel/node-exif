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
  this.makernoteOffset;

  this.exifData = {
    image : {},                 // Information about the main image
    thumbnail : {},             // Information about the thumbnail
    exif : {},                  // Exif information
    gps : {},                   // GPS information
    interoperability: {},       // Exif Interoperability information
    makernote : {}              // Makernote information
  };

  if (!options.image) {
    throw new Error('You have to provide an image, it is pretty hard to extract Exif data from nothing...');
  } else if (typeof callback !== 'function') {
    throw new Error('You have to provide a callback function.');
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

    fs.readFile(image, function (error, data) {
      if (error)
        callback(new Error('Encountered the following error while trying to read given image: '+error));
      else
        self.processImage(data, callback);
    });

  } else {

    callback(new Error('Given image is neither a buffer nor a file, please provide one of these.'));

  }

};

ExifImage.prototype.processImage = function (data, callback) {

  var self = this;
  var offset = 0;

  if (data[offset++] == 0xFF && data[offset++] == 0xD8) {
    self.imageType = 'JPEG';
  } else {
    callback(new Error('The given image is not a JPEG and thus unsupported right now.'));
    return;
  }

  try {

    while (offset < data.length) {

      if (data[offset++] != 0xFF) {
        callback(false, self.exifData);
        return;
      }

      if (data[offset++] == 0xE1) {
        var exifData = self.extractExifData(data, offset + 2, data.getShort(offset, true) - 2);
        callback(false, exifData);
        return;
      } else {
        offset += data.getShort(offset, true);
      }

    }

  } catch (error) {
    callback(error);
  }

  callback(new Error('No Exif segment found in the given image.'));

};

ExifImage.prototype.extractExifData = function (data, start, length) {

  var self = this;
  var tiffOffset = start + 6;
  var ifdOffset, numberOfEntries;

  // Exif data always starts with Exif\0\0
  if (data.toString('utf8', start, tiffOffset) != 'Exif\0\0') {
    throw new Error('The Exif data is not valid.');
  }

  // After the Exif start we either have 0x4949 if the following data is
  // stored in big endian or 0x4D4D if it is stored in little endian
  if (data.getShort(tiffOffset) == 0x4949) {
    this.isBigEndian = false;
  } else if (data.getShort(tiffOffset) == 0x4D4D) {
    this.isBigEndian = true;
  } else {
    throw new Error('Invalid TIFF data! Expected 0x4949 or 0x4D4D at offset '+(tiffOffset)+' but found 0x'+data[tiffOffset].toString(16).toUpperCase()+data[tiffOffset + 1].toString(16).toUpperCase()+".");
  }

  // Valid TIFF headers always have 0x002A here
  if (data.getShort(tiffOffset + 2, this.isBigEndian) != 0x002A) {
    var expected = (this.isBigEndian) ? '0x002A' : '0x2A00';
    throw new Error('Invalid TIFF data! Expected '+expected+' at offset '+(tiffOffset + 2)+' but found 0x'+data[tiffOffset + 2].toString(16).toUpperCase()+data[tiffOffset + 3].toString(16).toUpperCase()+".");
  }

  /********************************* IFD0 **********************************/

  // Offset to IFD0 which is always followed by two bytes with the amount of
  // entries in this IFD
  ifdOffset = tiffOffset + data.getLong(tiffOffset + 4, this.isBigEndian);
  numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);

  // Each IFD entry consists of 12 bytes which we loop through and extract
  // the data from
  for (var i = 0; i < numberOfEntries; i++) {
    var exifEntry = self.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.exif);
    if (exifEntry && exifEntry.tagName !== null) this.exifData.image[exifEntry.tagName] = exifEntry.value;
  }

  /********************************* IFD1 **********************************/

  // Check if there is an offset for IFD1. If so it is always followed by two
  // bytes with the amount of entries in this IFD, if not there is no IFD1
  var nextIfdOffset = data.getLong(ifdOffset + 2 + (numberOfEntries * 12), this.isBigEndian)
  if (nextIfdOffset != 0x00000000) {

    ifdOffset = tiffOffset + nextIfdOffset;
    numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);

    // Each IFD entry consists of 12 bytes which we loop through and extract
    // the data from
    for (var i = 0; i < numberOfEntries; i++) {
      var exifEntry = self.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.exif);
      if (exifEntry && exifEntry.tagName !== null) this.exifData.thumbnail[exifEntry.tagName] = exifEntry.value;
    }
  }

  /******************************* EXIF IFD ********************************/

  // Look for a pointer to the Exif IFD in IFD0 and extract information from
  // it if available
  if (typeof this.exifData.image[ExifImage.TAGS.exif[0x8769]] != "undefined") {

    ifdOffset = tiffOffset + this.exifData.image[ExifImage.TAGS.exif[0x8769]];
    numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);

    // Each IFD entry consists of 12 bytes which we loop through and extract
    // the data from
    for (var i = 0; i < numberOfEntries; i++) {
      var exifEntry = self.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.exif);
      if (exifEntry && exifEntry.tagName !== null) this.exifData.exif[exifEntry.tagName] = exifEntry.value;
    }

  }

  /******************************** GPS IFD ********************************/

  // Look for a pointer to the GPS IFD in IFD0 and extract information from
  // it if available
  if (typeof this.exifData.image[ExifImage.TAGS.exif[0x8825]] != "undefined") {

    ifdOffset = tiffOffset + this.exifData.image[ExifImage.TAGS.exif[0x8825]];
    numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);

    // Each IFD entry consists of 12 bytes which we loop through and extract
    // the data from
    for (var i = 0; i < numberOfEntries; i++) {
      var exifEntry = self.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.gps);
      if (exifEntry && exifEntry.tagName !== null) this.exifData.gps[exifEntry.tagName] = exifEntry.value;
    }

  }

  /************************* Interoperability IFD **************************/

  // Look for a pointer to the interoperatbility IFD in the Exif IFD and
  // extract information from it if available
  if (typeof this.exifData.exif[ExifImage.TAGS.exif[0xA005]] != "undefined") {

    ifdOffset = tiffOffset + this.exifData.exif[ExifImage.TAGS.exif[0xA005]];
    numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);

    // Each IFD entry consists of 12 bytes which we loop through and extract
    // the data from
    for (var i = 0; i < numberOfEntries; i++) {
      var exifEntry = self.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.exif);
      if (exifEntry && exifEntry.tagName !== null) this.exifData.interoperability[exifEntry.tagName] = exifEntry.value;
    }

  }

  /***************************** Makernote IFD *****************************/

  // Look for Makernote data in the Exif IFD, check which type of proprietary
  // Makernotes the image contains, load the respective functionality and
  // start the extraction
  if (typeof this.exifData.exif[ExifImage.TAGS.exif[0x927C]] != "undefined") {

    // Check the header to see what kind of Makernote we are dealing with
    if (this.exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 7) === "OLYMP\x00\x01" || this.exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 7) === "OLYMP\x00\x02") {
      this.extractMakernotes = require('./makernotes/olympus').extractMakernotes;
    } else if (this.exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 7) === "AGFA \x00\x01") {
      this.extractMakernotes = require('./makernotes/agfa').extractMakernotes;
    } else if (this.exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 8) === "EPSON\x00\x01\x00") {
      this.extractMakernotes = require('./makernotes/epson').extractMakernotes;
    } else if (this.exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 8) === "FUJIFILM") {
      this.extractMakernotes = require('./makernotes/fujifilm').extractMakernotes;
		} else if (this.exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 9) === "Panasonic") {
			this.extractMakernotes = require('./makernotes/panasonic').extractMakernotes;
    } else if (this.exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 5) === "SANYO") {
      this.extractMakernotes = require('./makernotes/sanyo').extractMakernotes;
    } else {
      // Makernotes are available but the format is not recognized so
      // an error message is pushed instead, this ain't the best
      // solution but should do for now
      this.exifData.makernote['error'] = 'Unable to extract Makernote information as it is in an unsupported or unrecognized format.';
    }

    if (typeof this.exifData.makernote['error'] == "undefined") {
      this.exifData.makernote = this.extractMakernotes(data, self.makernoteOffset, tiffOffset);
    }

  }

  return this.exifData;

};

ExifImage.prototype.extractExifEntry = function (data, entryOffset, tiffOffset, isBigEndian, tags) {

  var self = this;
  var tagName;

  var entry = {
    tag : data.slice(entryOffset, entryOffset + 2),
    tagId : null,
    tagName : null,
    format : data.getShort(entryOffset + 2, isBigEndian),
    components : data.getLong(entryOffset + 4, isBigEndian),
    valueOffset: null,
    value : []
  }

  entry.tagId = entry.tag.getShort(0, isBigEndian);

  // The tagId may correspond to more then one tagName so check which
  if (tags && tags[entry.tagId] && typeof tags[entry.tagId] == "function") {
    if (!(entry.tagName = tags[entry.tagId](entry))) {
      return false;
    }

  // The tagId corresponds to exactly one tagName
  } else if (tags && tags[entry.tagId]) {
    entry.tagName = tags[entry.tagId];

  // The tagId is not recognized
  } else {
    return false;
  }

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
        entry.value.push(data.getLong(entry.valueOffset + i * 8, isBigEndian) / data.getLong(entry.valueOffset + i * 8 + 4, isBigEndian));
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
        entry.value.push(data.getSignedLong(entry.valueOffset + i * 8, isBigEndian) / data.getSignedLong(entry.valueOffset + i * 8 + 4, isBigEndian));
      break;

    default:
      return false;

  }

  // If this is the Makernote tag save its offset for later use
  if (entry.tagName === "MakerNote") self.makernoteOffset = entry.valueOffset;

  // If the value array has only one element we don't need an array
  if (entry.value.length == 1) entry.value = entry.value[0];

  return entry;

};

/**
 * Comprehensive list of TIFF and Exif tags found on
 * http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/EXIF.html
 */
ExifImage.TAGS = {

  // Exif tags
  exif : {

    0x0001 : "InteropIndex",
    0x0002 : "InteropVersion",
    0x000B : "ProcessingSoftware",
    0x00FE : "SubfileType",
    0x00FF : "OldSubfileType",
    0x0100 : "ImageWidth",
    0x0101 : "ImageHeight",
    0x0102 : "BitsPerSample",
    0x0103 : "Compression",
    0x0106 : "PhotometricInterpretation",
    0x0107 : "Thresholding",
    0x0108 : "CellWidth",
    0x0109 : "CellLength",
    0x010A : "FillOrder",
    0x010D : "DocumentName",
    0x010E : "ImageDescription",
    0x010F : "Make",
    0x0110 : "Model",
    0x0111 : "StripOffsets",
    0x0112 : "Orientation",
    0x0115 : "SamplesPerPixel",
    0x0116 : "RowsPerStrip",
    0x0117 : "StripByteCounts",
    0x0118 : "MinSampleValue",
    0x0119 : "MaxSampleValue",
    0x011A : "XResolution",
    0x011B : "YResolution",
    0x011C : "PlanarConfiguration",
    0x011D : "PageName",
    0x011E : "XPosition",
    0x011F : "YPosition",
    0x0120 : "FreeOffsets",
    0x0121 : "FreeByteCounts",
    0x0122 : "GrayResponseUnit",
    0x0123 : "GrayResponseCurve",
    0x0124 : "T4Options",
    0x0125 : "T6Options",
    0x0128 : "ResolutionUnit",
    0x0129 : "PageNumber",
    0x012C : "ColorResponseUnit",
    0x012D : "TransferFunction",
    0x0131 : "Software",
    0x0132 : "ModifyDate",
    0x013B : "Artist",
    0x013C : "HostComputer",
    0x013D : "Predictor",
    0x013E : "WhitePoint",
    0x013F : "PrimaryChromaticities",
    0x0140 : "ColorMap",
    0x0141 : "HalftoneHints",
    0x0142 : "TileWidth",
    0x0143 : "TileLength",
    0x0144 : "TileOffsets",
    0x0145 : "TileByteCounts",
    0x0146 : "BadFaxLines",
    0x0147 : "CleanFaxData",
    0x0148 : "ConsecutiveBadFaxLines",
    0x014A : "SubIFD",
    0x014C : "InkSet",
    0x014D : "InkNames",
    0x014E : "NumberofInks",
    0x0150 : "DotRange",
    0x0151 : "TargetPrinter",
    0x0152 : "ExtraSamples",
    0x0153 : "SampleFormat",
    0x0154 : "SMinSampleValue",
    0x0155 : "SMaxSampleValue",
    0x0156 : "TransferRange",
    0x0157 : "ClipPath",
    0x0158 : "XClipPathUnits",
    0x0159 : "YClipPathUnits",
    0x015A : "Indexed",
    0x015B : "JPEGTables",
    0x015F : "OPIProxy",
    0x0190 : "GlobalParametersIFD",
    0x0191 : "ProfileType",
    0x0192 : "FaxProfile",
    0x0193 : "CodingMethods",
    0x0194 : "VersionYear",
    0x0195 : "ModeNumber",
    0x01B1 : "Decode",
    0x01B2 : "DefaultImageColor",
    0x01B3 : "T82Options",
    0x01B5 : "JPEGTables",
    0x0200 : "JPEGProc",
    0x0201 : "ThumbnailOffset",
    0x0202 : "ThumbnailLength",
    0x0203 : "JPEGRestartInterval",
    0x0205 : "JPEGLosslessPredictors",
    0x0206 : "JPEGPointTransforms",
    0x0207 : "JPEGQTables",
    0x0208 : "JPEGDCTables",
    0x0209 : "JPEGACTables",
    0x0211 : "YCbCrCoefficients",
    0x0212 : "YCbCrSubSampling",
    0x0213 : "YCbCrPositioning",
    0x0214 : "ReferenceBlackWhite",
    0x022F : "StripRowCounts",
    0x02BC : "ApplicationNotes",
    0x03E7 : "USPTOMiscellaneous",
    0x1000 : "RelatedImageFileFormat",
    0x1001 : "RelatedImageWidth",
    0x1002 : "RelatedImageHeight",
    0x4746 : "Rating",
    0x4747 : "XP_DIP_XML",
    0x4748 : "StitchInfo",
    0x4749 : "RatingPercent",
    0x800D : "ImageID",
    0x80A3 : "WangTag1",
    0x80A4 : "WangAnnotation",
    0x80A5 : "WangTag3",
    0x80A6 : "WangTag4",
    0x80E3 : "Matteing",
    0x80E4 : "DataType",
    0x80E5 : "ImageDepth",
    0x80E6 : "TileDepth",
    0x827D : "Model2",
    0x828D : "CFARepeatPatternDim",
    0x828E : "CFAPattern2",
    0x828F : "BatteryLevel",
    0x8290 : "KodakIFD",
    0x8298 : "Copyright",
    0x829A : "ExposureTime",
    0x829D : "FNumber",
    0x82A5 : "MDFileTag",
    0x82A6 : "MDScalePixel",
    0x82A7 : "MDColorTable",
    0x82A8 : "MDLabName",
    0x82A9 : "MDSampleInfo",
    0x82AA : "MDPrepDate",
    0x82AB : "MDPrepTime",
    0x82AC : "MDFileUnits",
    0x830E : "PixelScale",
    0x8335 : "AdventScale",
    0x8336 : "AdventRevision",
    0x835C : "UIC1Tag",
    0x835D : "UIC2Tag",
    0x835E : "UIC3Tag",
    0x835F : "UIC4Tag",
    0x83BB : "IPTC-NAA",
    0x847E : "IntergraphPacketData",
    0x847F : "IntergraphFlagRegisters",
    0x8480 : "IntergraphMatrix",
    0x8481 : "INGRReserved",
    0x8482 : "ModelTiePoint",
    0x84E0 : "Site",
    0x84E1 : "ColorSequence",
    0x84E2 : "IT8Header",
    0x84E3 : "RasterPadding",
    0x84E4 : "BitsPerRunLength",
    0x84E5 : "BitsPerExtendedRunLength",
    0x84E6 : "ColorTable",
    0x84E7 : "ImageColorIndicator",
    0x84E8 : "BackgroundColorIndicator",
    0x84E9 : "ImageColorValue",
    0x84EA : "BackgroundColorValue",
    0x84EB : "PixelIntensityRange",
    0x84EC : "TransparencyIndicator",
    0x84ED : "ColorCharacterization",
    0x84EE : "HCUsage",
    0x84EF : "TrapIndicator",
    0x84F0 : "CMYKEquivalent",
    0x8546 : "SEMInfo",
    0x8568 : "AFCP_IPTC",
    0x85B8 : "PixelMagicJBIGOptions",
    0x85D8 : "ModelTransform",
    0x8602 : "WB_GRGBLevels",
    0x8606 : "LeafData",
    0x8649 : "PhotoshopSettings",
    0x8769 : "ExifOffset",
    0x8773 : "ICC_Profile",
    0x877F : "TIFF_FXExtensions",
    0x8780 : "MultiProfiles",
    0x8781 : "SharedData",
    0x8782 : "T88Options",
    0x87AC : "ImageLayer",
    0x87AF : "GeoTiffDirectory",
    0x87B0 : "GeoTiffDoubleParams",
    0x87B1 : "GeoTiffAsciiParams",
    0x8822 : "ExposureProgram",
    0x8824 : "SpectralSensitivity",
    0x8825 : "GPSInfo",
    0x8827 : "ISO",
    0x8828 : "Opto-ElectricConvFactor",
    0x8829 : "Interlace",
    0x882A : "TimeZoneOffset",
    0x882B : "SelfTimerMode",
    0x8830 : "SensitivityType",
    0x8831 : "StandardOutputSensitivity",
    0x8832 : "RecommendedExposureIndex",
    0x8833 : "ISOSpeed",
    0x8834 : "ISOSpeedLatitudeyyy",
    0x8835 : "ISOSpeedLatitudezzz",
    0x885C : "FaxRecvParams",
    0x885D : "FaxSubAddress",
    0x885E : "FaxRecvTime",
    0x888A : "LeafSubIFD",
    0x9000 : "ExifVersion",
    0x9003 : "DateTimeOriginal",
    0x9004 : "CreateDate",
    0x9101 : "ComponentsConfiguration",
    0x9102 : "CompressedBitsPerPixel",
    0x9201 : "ShutterSpeedValue",
    0x9202 : "ApertureValue",
    0x9203 : "BrightnessValue",
    0x9204 : "ExposureCompensation",
    0x9205 : "MaxApertureValue",
    0x9206 : "SubjectDistance",
    0x9207 : "MeteringMode",
    0x9208 : "LightSource",
    0x9209 : "Flash",
    0x920A : "FocalLength",
    0x920B : "FlashEnergy",
    0x920C : "SpatialFrequencyResponse",
    0x920D : "Noise",
    0x920E : "FocalPlaneXResolution",
    0x920F : "FocalPlaneYResolution",
    0x9210 : "FocalPlaneResolutionUnit",
    0x9211 : "ImageNumber",
    0x9212 : "SecurityClassification",
    0x9213 : "ImageHistory",
    0x9214 : "SubjectArea",
    0x9215 : "ExposureIndex",
    0x9216 : "TIFF-EPStandardID",
    0x9217 : "SensingMethod",
    0x923A : "CIP3DataFile",
    0x923B : "CIP3Sheet",
    0x923C : "CIP3Side",
    0x923F : "StoNits",
    0x927C : "MakerNote",
    0x9286 : "UserComment",
    0x9290 : "SubSecTime",
    0x9291 : "SubSecTimeOriginal",
    0x9292 : "SubSecTimeDigitized",
    0x932F : "MSDocumentText",
    0x9330 : "MSPropertySetStorage",
    0x9331 : "MSDocumentTextPosition",
    0x935C : "ImageSourceData",
    0x9C9B : "XPTitle",
    0x9C9C : "XPComment",
    0x9C9D : "XPAuthor",
    0x9C9E : "XPKeywords",
    0x9C9F : "XPSubject",
    0xA000 : "FlashpixVersion",
    0xA001 : "ColorSpace",
    0xA002 : "ExifImageWidth",
    0xA003 : "ExifImageHeight",
    0xA004 : "RelatedSoundFile",
    0xA005 : "InteropOffset",
    0xA20B : "FlashEnergy",
    0xA20C : "SpatialFrequencyResponse",
    0xA20D : "Noise",
    0xA20E : "FocalPlaneXResolution",
    0xA20F : "FocalPlaneYResolution",
    0xA210 : "FocalPlaneResolutionUnit",
    0xA211 : "ImageNumber",
    0xA212 : "SecurityClassification",
    0xA213 : "ImageHistory",
    0xA214 : "SubjectLocation",
    0xA215 : "ExposureIndex",
    0xA216 : "TIFF-EPStandardID",
    0xA217 : "SensingMethod",
    0xA300 : "FileSource",
    0xA301 : "SceneType",
    0xA302 : "CFAPattern",
    0xA401 : "CustomRendered",
    0xA402 : "ExposureMode",
    0xA403 : "WhiteBalance",
    0xA404 : "DigitalZoomRatio",
    0xA405 : "FocalLengthIn35mmFormat",
    0xA406 : "SceneCaptureType",
    0xA407 : "GainControl",
    0xA408 : "Contrast",
    0xA409 : "Saturation",
    0xA40A : "Sharpness",
    0xA40B : "DeviceSettingDescription",
    0xA40C : "SubjectDistanceRange",
    0xA420 : "ImageUniqueID",
    0xA430 : "OwnerName",
    0xA431 : "SerialNumber",
    0xA432 : "LensInfo",
    0xA433 : "LensMake",
    0xA434 : "LensModel",
    0xA435 : "LensSerialNumber",
    0xA480 : "GDALMetadata",
    0xA481 : "GDALNoData",
    0xA500 : "Gamma",
    0xAFC0 : "ExpandSoftware",
    0xAFC1 : "ExpandLens",
    0xAFC2 : "ExpandFilm",
    0xAFC3 : "ExpandFilterLens",
    0xAFC4 : "ExpandScanner",
    0xAFC5 : "ExpandFlashLamp",
    0xBC01 : "PixelFormat",
    0xBC02 : "Transformation",
    0xBC03 : "Uncompressed",
    0xBC04 : "ImageType",
    0xBC80 : "ImageWidth",
    0xBC81 : "ImageHeight",
    0xBC82 : "WidthResolution",
    0xBC83 : "HeightResolution",
    0xBCC0 : "ImageOffset",
    0xBCC1 : "ImageByteCount",
    0xBCC2 : "AlphaOffset",
    0xBCC3 : "AlphaByteCount",
    0xBCC4 : "ImageDataDiscard",
    0xBCC5 : "AlphaDataDiscard",
    0xC427 : "OceScanjobDesc",
    0xC428 : "OceApplicationSelector",
    0xC429 : "OceIDNumber",
    0xC42A : "OceImageLogic",
    0xC44F : "Annotations",
    0xC4A5 : "PrintIM",
    0xC580 : "USPTOOriginalContentType",
    0xC612 : "DNGVersion",
    0xC613 : "DNGBackwardVersion",
    0xC614 : "UniqueCameraModel",
    0xC615 : "LocalizedCameraModel",
    0xC616 : "CFAPlaneColor",
    0xC617 : "CFALayout",
    0xC618 : "LinearizationTable",
    0xC619 : "BlackLevelRepeatDim",
    0xC61A : "BlackLevel",
    0xC61B : "BlackLevelDeltaH",
    0xC61C : "BlackLevelDeltaV",
    0xC61D : "WhiteLevel",
    0xC61E : "DefaultScale",
    0xC61F : "DefaultCropOrigin",
    0xC620 : "DefaultCropSize",
    0xC621 : "ColorMatrix1",
    0xC622 : "ColorMatrix2",
    0xC623 : "CameraCalibration1",
    0xC624 : "CameraCalibration2",
    0xC625 : "ReductionMatrix1",
    0xC626 : "ReductionMatrix2",
    0xC627 : "AnalogBalance",
    0xC628 : "AsShotNeutral",
    0xC629 : "AsShotWhiteXY",
    0xC62A : "BaselineExposure",
    0xC62B : "BaselineNoise",
    0xC62C : "BaselineSharpness",
    0xC62D : "BayerGreenSplit",
    0xC62E : "LinearResponseLimit",
    0xC62F : "CameraSerialNumber",
    0xC630 : "DNGLensInfo",
    0xC631 : "ChromaBlurRadius",
    0xC632 : "AntiAliasStrength",
    0xC633 : "ShadowScale",
    0xC634 : "DNGPrivateData",
    0xC635 : "MakerNoteSafety",
    0xC640 : "RawImageSegmentation",
    0xC65A : "CalibrationIlluminant1",
    0xC65B : "CalibrationIlluminant2",
    0xC65C : "BestQualityScale",
    0xC65D : "RawDataUniqueID",
    0xC660 : "AliasLayerMetadata",
    0xC68B : "OriginalRawFileName",
    0xC68C : "OriginalRawFileData",
    0xC68D : "ActiveArea",
    0xC68E : "MaskedAreas",
    0xC68F : "AsShotICCProfile",
    0xC690 : "AsShotPreProfileMatrix",
    0xC691 : "CurrentICCProfile",
    0xC692 : "CurrentPreProfileMatrix",
    0xC6BF : "ColorimetricReference",
    0xC6D2 : "PanasonicTitle",
    0xC6D3 : "PanasonicTitle2",
    0xC6F3 : "CameraCalibrationSig",
    0xC6F4 : "ProfileCalibrationSig",
    0xC6F5 : "ProfileIFD",
    0xC6F6 : "AsShotProfileName",
    0xC6F7 : "NoiseReductionApplied",
    0xC6F8 : "ProfileName",
    0xC6F9 : "ProfileHueSatMapDims",
    0xC6FA : "ProfileHueSatMapData1",
    0xC6FB : "ProfileHueSatMapData2",
    0xC6FC : "ProfileToneCurve",
    0xC6FD : "ProfileEmbedPolicy",
    0xC6FE : "ProfileCopyright",
    0xC714 : "ForwardMatrix1",
    0xC715 : "ForwardMatrix2",
    0xC716 : "PreviewApplicationName",
    0xC717 : "PreviewApplicationVersion",
    0xC718 : "PreviewSettingsName",
    0xC719 : "PreviewSettingsDigest",
    0xC71A : "PreviewColorSpace",
    0xC71B : "PreviewDateTime",
    0xC71C : "RawImageDigest",
    0xC71D : "OriginalRawFileDigest",
    0xC71E : "SubTileBlockSize",
    0xC71F : "RowInterleaveFactor",
    0xC725 : "ProfileLookTableDims",
    0xC726 : "ProfileLookTableData",
    0xC740 : "OpcodeList1",
    0xC741 : "OpcodeList2",
    0xC74E : "OpcodeList3",
    0xC761 : "NoiseProfile",
    0xC763 : "TimeCodes",
    0xC764 : "FrameRate",
    0xC772 : "TStop",
    0xC789 : "ReelName",
    0xC791 : "OriginalDefaultFinalSize",
    0xC792 : "OriginalBestQualitySize",
    0xC793 : "OriginalDefaultCropSize",
    0xC7A1 : "CameraLabel",
    0xC7A3 : "ProfileHueSatMapEncoding",
    0xC7A4 : "ProfileLookTableEncoding",
    0xC7A5 : "BaselineExposureOffset",
    0xC7A6 : "DefaultBlackRender",
    0xC7A7 : "NewRawImageDigest",
    0xC7A8 : "RawToPreviewGain",
    0xC7B5 : "DefaultUserCrop",
    0xEA1C : "Padding",
    0xEA1D : "OffsetSchema",
    0xFDE8 : "OwnerName",
    0xFDE9 : "SerialNumber",
    0xFDEA : "Lens",
    0xFE00 : "KDC_IFD",
    0xFE4C : "RawFile",
    0xFE4D : "Converter",
    0xFE4E : "WhiteBalance",
    0xFE51 : "Exposure",
    0xFE52 : "Shadows",
    0xFE53 : "Brightness",
    0xFE54 : "Contrast",
    0xFE55 : "Saturation",
    0xFE56 : "Sharpness",
    0xFE57 : "Smoothness",
    0xFE58 : "MoireFilter"

  },

  // GPS Tags
  gps : {

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
    0x001F : 'GPSHPositioningError'

  }

};