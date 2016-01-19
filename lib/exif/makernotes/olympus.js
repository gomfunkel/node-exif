/**
 * Extracts Olympus flavored Makernotes.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {

  // List of vendor specific Makernote tags found on
  // http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/Olympus.html
  var tags = {

    0x0000 : "MakerNoteVersion",
    0x0001 : "MinoltaCameraSettingsOld",
    0x0003 : "MinoltaCameraSettings",
    0x0040 : "CompressedImageSize",
    0x0081 : "PreviewImageData",
    0x0088 : "PreviewImageStart",
    0x0089 : "PreviewImageLength",
    0x0100 : "ThumbnailImage",
    0x0104 : "BodyFirmwareVersion",
    0x0200 : "SpecialMode",
    0x0201 : "Quality",
    0x0202 : "Macro",
    0x0203 : "BWMode",
    0x0204 : "DigitalZoom",
    0x0205 : "FocalPlaneDiagonal",
    0x0206 : "LensDistortionParams",
    0x0207 : "CameraType",
    0x0208 : "TextInfo",
    0x0209 : "CameraID",
    0x020B : "EpsonImageWidth",
    0x020C : "EpsonImageHeight",
    0x020D : "EpsonSoftware",
    0x0280 : "PreviewImage",
    0x0300 : "PreCaptureFrames",
    0x0301 : "WhiteBoard",
    0x0302 : "OneTouchWB",
    0x0303 : "WhiteBalanceBracket",
    0x0304 : "WhiteBalanceBias",
    0x0403 : "SceneMode",
    0x0404 : "SerialNumber",
    0x0405 : "Firmware",
    0x0E00 : "PrintIM",
    0x0F00 : "DataDump",
    0x0F01 : "DataDump2",
    0x0F04 : "ZoomedPreviewStart",
    0x0F05 : "ZoomedPreviewLength",
    0x0F06 : "ZoomedPreviewSize",
    0x1000 : "ShutterSpeedValue",
    0x1001 : "ISOValue",
    0x1002 : "ApertureValue",
    0x1003 : "BrightnessValue",
    0x1004 : "FlashMode",
    0x1005 : "FlashDevice",
    0x1006 : "ExposureCompensation",
    0x1007 : "SensorTemperature",
    0x1008 : "LensTemperature",
    0x1009 : "LightCondition",
    0x100A : "FocusRange",
    0x100B : "FocusMode",
    0x100C : "ManualFocusDistance",
    0x100D : "ZoomStepCount",
    0x100E : "FocusStepCount",
    0x100F : "Sharpness",
    0x1010 : "FlashChargeLevel",
    0x1011 : "ColorMatrix",
    0x1012 : "BlackLevel",
    0x1013 : "ColorTemperatureBG?",
    0x1014 : "ColorTemperatureRG?",
    0x1015 : "WBMode",
    0x1017 : "RedBalance",
    0x1018 : "BlueBalance",
    0x1019 : "ColorMatrixNumber",
    0x101A : "SerialNumber",
    0x101B : "ExternalFlashAE1_0?",
    0x101C : "ExternalFlashAE2_0?",
    0x101D : "InternalFlashAE1_0?",
    0x101E : "InternalFlashAE2_0?",
    0x101F : "ExternalFlashAE1?",
    0x1020 : "ExternalFlashAE2?",
    0x1021 : "InternalFlashAE1?",
    0x1022 : "InternalFlashAE2?",
    0x1023 : "FlashExposureComp",
    0x1024 : "InternalFlashTable",
    0x1025 : "ExternalFlashGValue",
    0x1026 : "ExternalFlashBounce",
    0x1027 : "ExternalFlashZoom",
    0x1028 : "ExternalFlashMode",
    0x1029 : "Contrast",
    0x102A : "SharpnessFactor",
    0x102B : "ColorControl",
    0x102C : "ValidBits",
    0x102D : "CoringFilter",
    0x102E : "OlympusImageWidth",
    0x102F : "OlympusImageHeight",
    0x1030 : "SceneDetect",
    0x1031 : "SceneArea?",
    0x1033 : "SceneDetectData?",
    0x1034 : "CompressionRatio",
    0x1035 : "PreviewImageValid",
    0x1036 : "PreviewImageStart",
    0x1037 : "PreviewImageLength",
    0x1038 : "AFResult",
    0x1039 : "CCDScanMode",
    0x103A : "NoiseReduction",
    0x103B : "FocusStepInfinity",
    0x103C : "FocusStepNear",
    0x103D : "LightValueCenter",
    0x103E : "LightValuePeriphery",
    0x103F : "FieldCount?",
    0x2010 : "Equipment",
    0x2020 : "CameraSettings",
    0x2030 : "RawDevelopment",
    0x2031 : "RawDev2",
    0x2040 : "ImageProcessing",
    0x2050 : "FocusInfo",
    0x2100 : "Olympus2100",
    0x2200 : "Olympus2200",
    0x2300 : "Olympus2300",
    0x2400 : "Olympus2400",
    0x2500 : "Olympus2500",
    0x2600 : "Olympus2600",
    0x2700 : "Olympus2700",
    0x2800 : "Olympus2800",
    0x2900 : "Olympus2900",
    0x3000 : "RawInfo",
    0x4000 : "MainInfo",
    0x5000 : "UnknownInfo"

  };

  // Olympus flavored Makernote data starts after eight bytes
  var ifdOffset = makernoteOffset + 8;

  // Get the number of entries and extract them
  var numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
  if (this.options.olympusMaxEntries) {
    numberOfEntries=Math.min(numberOfEntries, this.options.olympusMaxEntries);
  }

  var makernoteData = {};

  for (var i = 0; i < numberOfEntries; i++) {
    var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, tags);
    if (exifEntry && exifEntry.tagName !== null) makernoteData[exifEntry.tagName] = exifEntry.value;
  }

  return makernoteData;

};