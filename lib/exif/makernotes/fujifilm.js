/**
 * Extracts Fujifilm flavored Makernotes which are always stored in little
 * endian, no matter what the rest of the file is. Additionally the offsets
 * are relative to the start of the Makernote instead of the start of the
 * TIFF header.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {

  var makernoteData = {};

  // List of vendor specific Makernote tags found on
  // http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/FujiFilm.html
  var tags = {
    0x0000 : "Version",
    0x0010 : "InternalSerialNumber",
    0x1000 : "Quality",
    0x1001 : "Sharpness",
    0x1002 : "WhiteBalance",
    0x1003 : "Saturation",
    0x1004 : "Contrast",
    0x1005 : "ColorTemperature",
    0x1006 : "Contrast",
    0x100a : "WhiteBalanceFineTune",
    0x100b : "NoiseReduction",
    0x100e : "HighISONoiseReduction",
    0x1010 : "FujiFlashMode",
    0x1011 : "FlashExposureComp",
    0x1020 : "Macro",
    0x1021 : "FocusMode",
    0x1023 : "FocusPixel",
    0x1030 : "SlowSync",
    0x1033 : "EXRAuto",
    0x1034 : "EXRMode",
    0x1100 : "AutoBracketing",
    0x1101 : "SequenceNumber",
    0x1210 : "ColorMode",
    0x1300 : "BlurWarning",
    0x1301 : "FocusWarning",
    0x1302 : "ExposureWarning",
    0x1304 : "GEImageSize",
    0x1400 : "DynamicRange",
    0x1401 : "FilmMode",
    0x1402 : "DynamicRangeSetting",
    0x1403 : "DevelopmentDynamicRange",
    0x1404 : "MinFocalLength",
    0x1405 : "MaxFocalLength",
    0x1406 : "MaxApertureAtMinFocal",
    0x1407 : "MaxApertureAtMaxFocal",
    0x140b : "AutoDynamicRange",
    0x4100 : "FacesDetected",
    0x4103 : "FacePositions",
    0x4282 : "FaceRecInfo",
    0x8000 : "FileSource",
    0x8002 : "OrderNumber",
    0x8003 : "FrameNumber",
    0xb211 : "Parallax"

  };

  // Start of the Fujifilm flavored Makernote data is determined by the four
  // bytes following the Makernote vendor name
  var ifdOffset = makernoteOffset + data.getLong(makernoteOffset + 8, false, tiffOffset);

  // Get the number of entries and extract them
  var numberOfEntries = data.getShort(ifdOffset, false, tiffOffset);

  for (var i = 0; i < numberOfEntries; i++) {
    var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), makernoteOffset, false, tags);
    if (exifEntry && exifEntry.tagName !== null) makernoteData[exifEntry.tagName] = exifEntry.value;
  }

  return makernoteData;

};