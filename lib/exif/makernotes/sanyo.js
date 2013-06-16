/**
 * Extracts Sanyo flavored Makernotes.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {

	var makernoteData = {};

	// List of vendor specific Makernote tags found on
	// http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/Sanyo.html
	var tags = {

		0x00FF : "MakerNoteOffset",
		0x0100 : "SanyoThumbnail",
		0x0200 : "SpecialMode",
		0x0201 : "SanyoQuality",
		0x0202 : "Macro",
		0x0204 : "DigitalZoom",
		0x0207 : "SoftwareVersion",
		0x0208 : "PictInfo",
		0x0209 : "CameraID",
		0x020E : "SequentialShot",
		0x020F : "WideRange",
		0x0210 : "ColorAdjustmentMode",
		0x0213 : "QuickShot",
		0x0214 : "SelfTimer",
		0x0216 : "VoiceMemo",
		0x0217 : "RecordShutterRelease",
		0x0218 : "FlickerReduce",
		0x0219 : "OpticalZoomOn",
		0x021B : "DigitalZoomOn",
		0x021D : "LightSourceSpecial",
		0x021E : "Resaved",
		0x021F : "SceneSelect",
		0x0223 : function (entry) {

			switch (entry.format) {
				case 0x0005:
					return "ManualFocusDistance";
				case 0x0007:
					return "FaceInfo";
				default:
					return false;
			}

		},
		0x0224 : "SequenceShotInterval",
		0x0225 : "FlashMode",
		0x0E00 : "PrintIM",
		0x0F00 : "DataDump"

	};

	// Sanyo flavored Makernote data starts after eight bytes
	var ifdOffset = makernoteOffset + 8;

	// Get the number of entries and extract them
	var numberOfEntries = data.getShort(ifdOffset, this.isBigEndian, tiffOffset);

	var makernoteEndianness = this.isBigEndian;
	// according to http://search.cpan.org/~bettelli/Image-MetaData-JPEG-0.153/lib/Image/MetaData/JPEG.pod#On_the_problem_of_MakerNote_corruption_and_ways_to_overcome_it
	// it seems that makernotes should only have 1-255 items. If we see more than 255,
	// we probably have an endianness issue (i.e. the makernote is using a different endianness than
	// the container file/exif block). This seems like an OK mediation strategy.
	// endian-flipped-makernote.jpg shows a realworld file seen with this problem.
	if (numberOfEntries > 255) {
		makernoteEndianness = !makernoteEndianness;
		numberOfEntries = data.getShort(ifdOffset, makernoteEndianness, tiffOffset);
	}

	for (var i = 0; i < numberOfEntries; i++) {
		var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, makernoteEndianness, tags);
		if (exifEntry && exifEntry.tagName !== null) makernoteData[exifEntry.tagName] = exifEntry.value;
	}

	return makernoteData;

};