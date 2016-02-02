var assert = require('assert');
var fs=require('fs');
var Path = require('path');

describe('node-exif API', function() {
  
  var path=Path.join(__dirname, "evil1.jpg");
  var json='{"image":{"Make":"Canon","Model":"Canon PowerShot S400","Orientation":1,"XResolution":180,"YResolution":180,"ResolutionUnit":2,"Software":"Adobe Photoshop 7.0","ModifyDate":"2003:05:25 11:11:41","YCbCrPositioning":1,"ExifOffset":217},"thumbnail":{"Compression":6,"XResolution":72,"YResolution":72,"ResolutionUnit":2,"ThumbnailOffset":1057,"ThumbnailLength":6298},"exif":{"ExposureTime":0.125,"FNumber":2.8,"ExifVersion":{"type":"Buffer","data":[48,50,50,48]},"DateTimeOriginal":"2003:05:24 16:40:33","CreateDate":"2003:05:24 16:40:33","ComponentsConfiguration":{"type":"Buffer","data":[1,2,3,0]},"CompressedBitsPerPixel":3,"ShutterSpeedValue":3,"ApertureValue":2.96875,"ExposureCompensation":0,"MaxApertureValue":2.96875,"MeteringMode":5,"Flash":16,"FocalLength":7.40625,"UserComment":{"type":"Buffer","data":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"FlashpixVersion":{"type":"Buffer","data":[48,49,48,48]},"ColorSpace":1,"ExifImageWidth":400,"ExifImageHeight":300,"FocalPlaneXResolution":8114.285714285715,"FocalPlaneYResolution":8114.285714285715,"FocalPlaneResolutionUnit":2,"SensingMethod":2,"FileSource":{"type":"Buffer","data":[3]},"CustomRendered":0,"ExposureMode":0,"WhiteBalance":0,"DigitalZoomRatio":1,"SceneCaptureType":0},"gps":{},"interoperability":{},"makernote":{}}';

  
  it('test constructor (filename)', function(done) {

    var ExifImage = require('..').ExifImage;

    new ExifImage({image: path }, function(error, data) {
      if (error) {
        throw error;
      }
      
      assert.equal(JSON.stringify(data), json, "Not same datas ?");
      
      done();
    });
  });

  it('test constructor (buffer)', function(done) {

    var ExifImage = require('..').ExifImage;
    
    var buffer=fs.readFileSync(path);
    
    new ExifImage({image: buffer }, function(error, data) {
      if (error) {
        throw error;
      }
      
      assert.equal(JSON.stringify(data), json, "Not same datas ?");
      
      done();
    });
  });

  it('test loadImage (buffer)', function(done) {

    var ExifImage = require('..').ExifImage;
    
    var exif=new ExifImage();
    
    exif.loadImage(path, function(error, data) {
      if (error) {
        throw error;
      }
      
      assert.equal(JSON.stringify(data), json, "Not same datas ?");
      
      done();
    });
  });

  it('test loadImage (filename)', function(done) {

    var ExifImage = require('..').ExifImage;
    
    var buffer=fs.readFileSync(path);
    
    var exif=new ExifImage();
    
    exif.loadImage(buffer , function(error, data) {
      if (error) {
        throw error;
      }
      
      assert.equal(JSON.stringify(data), json, "Not same datas");
     
      done();
    });
  });

  it('test wrapper', function(done) {

    var Exif = require('..');

    Exif(path, function(error, data, dataPath) {
      if (error) {
        throw error;
      }
      
      assert.equal(dataPath, path, "Not same path");
      delete data.path;
     
      assert.equal(JSON.stringify(data), json, "Not same datas ?");
      
      done();
    });
  });
});

describe('node-exif tests', function() {
  var ExifImage = require('..').ExifImage;

  var files=fs.readdirSync(__dirname);
  
  files.forEach(function(f) {
    if (!/\.jpg$/.exec(f)) {
      return;
    }
    
    var path=Path.join(__dirname, f);
    
    it('test '+f, function(done) {
      var expected=String(fs.readFileSync(path+".json"));
      
      new ExifImage({image: path }, function(error, data) {
        if (error) {
          throw error;
        }

        var json=JSON.stringify(data);
        
        //console.log("    data=", json, json.length);
        // console.log("expected=", expected, expected.length);
        
        assert.equal(json, expected, "Data are not the same");
        
        done();
      });
    });
  });
});
