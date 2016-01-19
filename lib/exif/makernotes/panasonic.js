/**
 * Extracts Panasonic flavored Makernotes.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {

  // List of vendor specific Makernote tags found on
  // http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/Panasonic.html
  var tags = {

    0x0001 : "ImageQuality",
    0x0002 : "FirmwareVersion",
    0x0003 : "WhiteBalance",
    0x0007 : "FocusMode",
    0x000f : "AFAreaMode",
    0x001a : "ImageStabilization",
    0x001c : "MacroMode",
    0x001f : "ShootingMode",
    0x0020 : "Audio",
    0x0021 : "DataDump",
    0x0023 : "WhiteBalanceBias",
    0x0024 : "FlashBias",
    0x0025 : "InternalSerialNumber",
    0x0026 : "PanasonicExifVersion",
    0x0028 : "ColorEffect",
    0x0029 : "TimeSincePowerOn",
    0x002a : "BurstMode",
    0x002b : "SequenceNumber",
    0x002c : "ContrastMode",
    0x002d : "NoiseReduction",
    0x002e : "SelfTimer",
    0x0030 : "Rotation",
    0x0031 : "AFAssistLamp",
    0x0032 : "ColorMode",
    0x0033 : "BabyAge",
    0x0034 : "OpticalZoomMode",
    0x0035 : "ConversionLens",
    0x0036 : "TravelDay",
    0x0039 : "Contrast",
    0x003a : "WorldTimeLocation",
    0x003b : "TextStamp",
    0x003c : "ProgramISO",
    0x003d : "AdvancedSceneType",
    0x003e : "TextStamp",
    0x003f : "FacesDetected",
    0x0040 : "Saturation",
    0x0041 : "Sharpness",
    0x0042 : "FilmMode",
    0x0044 : "ColorTempKelvin",
    0x0045 : "BracketSettings",
    0x0046 : "WBShiftAB",
    0x0047 : "WBShiftGM",
    0x0048 : "FlashCurtain",
    0x0049 : "LongExposureNoiseReduction",
    0x004b : "PanasonicImageWidth",
    0x004c : "PanasonicImageHeight",
    0x004d : "AFPointPosition",
    0x004e : "FaceDetInfo",
    0x0051 : "LensType",
    0x0052 : "LensSerialNumber",
    0x0053 : "AccessoryType",
    0x0054 : "AccessorySerialNumber",
    0x0059 : "Transform",
    0x005d : "IntelligentExposure",
    0x0060 : "LensFirmwareVersion",
    0x0061 : "FaceRecInfo",
    0x0062 : "FlashWarning",
    0x0063 : "RecognizedFaceFlags?",
    0x0065 : "Title",
    0x0066 : "BabyName",
    0x0067 : "Location",
    0x0069 : "Country",
    0x006b : "State",
    0x006d : "City",
    0x006f : "Landmark",
    0x0070 : "IntelligentResolution",
    0x0077 : "BurstSpeed",
    0x0079 : "IntelligentD-Range",
    0x007c : "ClearRetouch",
    0x0086 : "ManometerPressure",
    0x0089 : "PhotoStyle",
    0x008a : "ShadingCompensation",
    0x008c : "AccelerometerZ",
    0x008d : "AccelerometerX",
    0x008e : "AccelerometerY",
    0x008f : "CameraOrientation",
    0x0090 : "RollAngle",
    0x0091 : "PitchAngle",
    0x0093 : "SweepPanoramaDirection",
    0x0094 : "SweepPanoramaFieldOfView",
    0x0096 : "TimerRecording",
    0x009d : "InternalNDFilter",
    0x009e : "HDR",
    0x009f : "ShutterType",
    0x00a3 : "ClearRetouchValue",
    0x00ab : "TouchAE",
    0x0e00 : "PrintIM",
    0x8000 : "MakerNoteVersion",
    0x8001 : "SceneMode",
    0x8004 : "WBRedLevel",
    0x8005 : "WBGreenLevel",
    0x8006 : "WBBlueLevel",
    0x8007 : "FlashFired",
    0x8008 : "TextStamp",
    0x8009 : "TextStamp",
    0x8010 : "BabyAge",
    0x8012 : "Transform"

  };

  // Panasonic flavored Makernote data starts after twelve bytes
  var ifdOffset = makernoteOffset + 12;

  // Get the number of entries and extract them
  var numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
  if (this.options.panasonicMaxEntries) {
    numberOfEntries=Math.min(numberOfEntries, this.options.panasonicMaxEntries);
  }

  var makernoteData = {};

  for (var i = 0; i < numberOfEntries; i++) {
    var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), makernoteOffset, false, tags);
    if( ! exifEntry ) break; // stop if exifEntry starts to return false, prevents a process out of memory
    if (exifEntry && exifEntry.tagName) {
      makernoteData[exifEntry.tagName] = exifEntry.value;
    }
  }

  return makernoteData;

};
