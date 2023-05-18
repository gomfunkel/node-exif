import { assert } from 'chai'
import fs from 'fs/promises'
import Path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ExifImage from '../lib/exif/ExifImage.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('node-exif API', function () {

  var path = Path.join(__dirname, "evil1.jpg");
  var json = '{"image":{"Make":"Canon","Model":"Canon PowerShot S400","Orientation":1,"XResolution":180,"YResolution":180,"ResolutionUnit":2,"Software":"Adobe Photoshop 7.0","ModifyDate":"2003:05:25 11:11:41","YCbCrPositioning":1,"ExifOffset":217},"thumbnail":{"Compression":6,"XResolution":72,"YResolution":72,"ResolutionUnit":2,"ThumbnailOffset":1057,"ThumbnailLength":6298},"exif":{"ExposureTime":0.125,"FNumber":2.8,"ExifVersion":{"type":"Buffer","data":[48,50,50,48]},"DateTimeOriginal":"2003:05:24 16:40:33","CreateDate":"2003:05:24 16:40:33","ComponentsConfiguration":{"type":"Buffer","data":[1,2,3,0]},"CompressedBitsPerPixel":3,"ShutterSpeedValue":3,"ApertureValue":2.96875,"ExposureCompensation":0,"MaxApertureValue":2.96875,"MeteringMode":5,"Flash":16,"FocalLength":7.40625,"UserComment":{"type":"Buffer","data":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"FlashpixVersion":{"type":"Buffer","data":[48,49,48,48]},"ColorSpace":1,"ExifImageWidth":400,"ExifImageHeight":300,"FocalPlaneXResolution":8114.285714285715,"FocalPlaneYResolution":8114.285714285715,"FocalPlaneResolutionUnit":2,"SensingMethod":2,"FileSource":{"type":"Buffer","data":[3]},"CustomRendered":0,"ExposureMode":0,"WhiteBalance":0,"DigitalZoomRatio":1,"SceneCaptureType":0},"gps":{},"interoperability":{},"makernote":{}}';


  it('test constructor (filename)', async function () {
    let data = await ExifImage({ image: path });
    assert.equal(JSON.stringify(data), json, "Not same datas ?");
  });

  it('test constructor (buffer)', async function () {
    var buffer = await fs.readFile(path);
    let data = await ExifImage({ image: buffer });
    assert.equal(JSON.stringify(data), json, "Not same datas ?");
  });
});

describe('node-exif tests', async function () {
  var files = await fs.readdir(__dirname);

  for (let file of files) {
    if (!/\.jpg$/.exec(file)) {
      continue;
    }

    var path = Path.join(__dirname, file);

    it('test ' + file, async function () {
      var expected = String(await fs.readFile(path + ".json"));

      let data = await ExifImage({ image: path });
      var json = JSON.stringify(data);

      assert.equal(json, expected, "Data are not the same");
    });
  }
});
