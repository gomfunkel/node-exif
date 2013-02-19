var exif = require('../lib/exif');

beforeEach(function () {
	this.addMatchers({
		toBeInstanceOf: function (expected) {return this.actual instanceof expected;},
		hasProperty: function (expected) {return expected in this.actual;}
	});
});


describe("exif data extraction", function () {
	it("should find no EXIF data in violet_3000x2000.jpg", function () {
		var result, errorResult;
		
		new exif.ExifImage({ image: "testdata/violet_3000x2000.jpg" }, function (error, exifData) {
			if (! error) {
				console.log("unexpected Exif success: " + JSON.stringify(exifData));
//			} else {
//				console.log("expected Exif error: " + error.message);
			}
			result = exifData;
			errorResult = error;
		});
		
		waitsFor(function () {return result || errorResult;}, "extracting violet_3000x2000.jpg", 15000);
		
		runs(function () {
			expect(errorResult).toBeDefined();
			expect(errorResult.message).toBeDefined();
			expect(result).not.toBeDefined();
		});
	});
	
	it("should find EXIF data in Cistothorus_palustris_CT.jpg", function () {
		var result, errorResult;
		
		new exif.ExifImage({ image: "testdata/Cistothorus_palustris_CT.jpg" }, function (error, exifData) {
			if (error) {
				console.log("Exif error: " + error.message);
			}
			result = exifData;
			errorResult = error;
		});
		
		waitsFor(function () {return result || errorResult;}, "extracting Cistothorus_palustris_CT.jpg", 15000);
		
		runs(function () {
			expect(errorResult).toBeFalsy();
			expect(result).toBeDefined();
			expect(result).hasProperty("image");
			expect(result.image[0].tagName).toEqual("Make");
			expect(result.image[0].value).toEqual("Canon");
			expect(result.image[1].tagName).toEqual("Model");
			expect(result.image[1].value).toEqual("Canon EOS 40D");
			expect(result.image[2].tagName).toEqual("Orientation");
			expect(result.image[2].value).toBe(1);
			expect(result.image[3].tagName).toEqual("XResolution");
			expect(result.image[3].value).toBe(72);
			expect(result.image[4].tagName).toEqual("YResolution");
			expect(result.image[4].value).toBe(72);
			expect(result.image[6].tagName).toEqual("Software");
			expect(result.image[6].value).toBe("GIMP 2.6.11");
			expect(result.image[7].tagName).toEqual("DateTime");
			expect(result.image[7].value).toBe("2011:06:19 16:06:37");
			expect(result).hasProperty("thumbnail");
			expect(result.thumbnail[0].tagName).toEqual("Compression");
			expect(result.thumbnail[0].value).toBe(6);
			expect(result.thumbnail[1].tagName).toEqual("XResolution");
			expect(result.thumbnail[1].value).toBe(72);
			expect(result.thumbnail[2].tagName).toEqual("YResolution");
			expect(result.thumbnail[2].value).toBe(72);
			expect(result.thumbnail[3].tagName).toEqual("ResolutionUnit");
			expect(result.thumbnail[3].value).toBe(2);
			expect(result).hasProperty("exif");
			expect(result.exif[0].tagName).toEqual("ExposureTime");
			expect(result.exif[0].value).toBe(0.002);
			expect(result.exif[1].tagName).toEqual("FNumber");
			expect(result.exif[1].value).toBe(8);
			expect(result.exif[2].tagName).toEqual("ExposureProgram");
			expect(result.exif[2].value).toBe(2);
			expect(result.exif[3].tagName).toEqual("ISOSpeedRatings");
			expect(result.exif[3].value).toBe(160);
			expect(result.exif[5].tagName).toEqual("DateTimeOriginal");
			expect(result.exif[5].value).toBe("2011:06:19 10:38:09");
			expect(result.exif[6].tagName).toEqual("DateTimeDigitized");
			expect(result.exif[6].value).toBe("2011:06:19 10:38:09");
			expect(result.exif[12].tagName).toEqual("FocalLength");
			expect(result.exif[12].value).toBe(400);   // mm
			expect(result.exif[13].tagName).toEqual("UserComment");
//			expect(result.exif[13].value).toBe("");
			expect(result.exif[19].tagName).toEqual("PixelXDimension");
			expect(result.exif[19].value).toBe(1736);
			expect(result.exif[20].tagName).toEqual("PixelYDimension");
			expect(result.exif[20].value).toBe(1736);
			expect(result.gps.length).toEqual(1);
			expect(result.gps[0].tagName).toEqual("GPSVersionID");
			expect(result).hasProperty("interoperability");
			expect(result.interoperability).toEqual([]);
			expect(result).hasProperty("makernote");
			expect(result.makernote).toEqual([]);
		});
	});
	
});
