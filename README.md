# node-exif

With _node-exif_ you can extract Exif metadata from images (JPEG). Exif is a format used, for example, by digital cameras and scanners to save additional information about an image in the image file. This information can be the camera model, resolution, where the image was taken (GPS) or when it was taken.

## node-exif CLI

Rodrigo Espinosa proposes the npm package [exif-cli](https://github.com/RodrigoEspinosa/exif-cli) to execute node-exif from a shell.

## Table of Contents

 * [Installation](#installation)
 * [Usage](#usage)
 * [ToDo / Ideas](#todo--ideas)
 * [License](#license)

## Installation

Installing using npm (node package manager):

    npm install exif

If you don't have npm installed or don't want to use it:

    cd ~/.node_libraries
    git clone git://github.com/gomfunkel/node-exif.git exif

## Usage

Easy. Just require _node-exif_ and throw an image at it. If _node-exif_ is able to extract data from the image it does so and returns an object with all the information found, if an error occurs you will receive an error message. To prove that it really is easy please see the following example.

```javascript
var ExifImage = require('exif').ExifImage;

try {
    new ExifImage({ image : 'myImage.jpg' }, function (error, exifData) {
        if (error)
            console.log('Error: '+error.message);
        else
            console.log(exifData); // Do something with your data!
    });
} catch (error) {
    console.log('Error: ' + error.message);
}
```

Instead of providing a filename of an image in your filesystem you can also pass a Buffer to ExifImage.

The data returned (`exifData` in the example above) is an object containing objects for each type of available Exif metadata:

 * `image` for image information data (IFD0)
 * `thumbnail` for information regarding a possibly embedded thumbnail (IFD1)
 * `exif` for Exif-specific attribute information (Exif IFD)
 * `gps` for GPS information (GPS IFD)
 * `interoperability` for interoperability information (Interoperability IFD)
 * `makernote` for vendor specific Exif information (Makernotes)

The ouput for an [example image](http://www.exif.org/samples/fujifilm-finepix40i.jpg) might thus look like this:

```
{
  image: {
    Make: 'FUJIFILM',
    Model: 'FinePix40i',
    Orientation: 1,
    XResolution: 72,
    YResolution: 72,
    ResolutionUnit: 2,
    Software: 'Digital Camera FinePix40i Ver1.39',
    ModifyDate: '2000:08:04 18:22:57',
    YCbCrPositioning: 2,
    Copyright: '          ',
    ExifOffset: 250
  },
  thumbnail: {
    Compression: 6,
    Orientation: 1,
    XResolution: 72,
    YResolution: 72,
    ResolutionUnit: 2,
    ThumbnailOffset: 1074,
    ThumbnailLength: 8691,
    YCbCrPositioning: 2
  },
  exif: {
    FNumber: 2.8,
    ExposureProgram: 2,
    ISO: 200,
    ExifVersion: <Buffer 30 32 31 30>,
    DateTimeOriginal: '2000:08:04 18:22:57',
    CreateDate: '2000:08:04 18:22:57',
    ComponentsConfiguration: <Buffer 01 02 03 00>,
    CompressedBitsPerPixel: 1.5,
    ShutterSpeedValue: 5.5,
    ApertureValue: 3,
    BrightnessValue: 0.26,
    ExposureCompensation: 0,
    MaxApertureValue: 3,
    MeteringMode: 5,
    Flash: 1,
    FocalLength: 8.7,
    MakerNote: <Buffer 46 55 4a 49 46 49 4c 4d 0c 00 00 00 0f 00 00 00 07 00 04 00 00 00 30 31 33 30 00 10 02 00 08 00 00 00 c6 00 00 00 01 10 03 00 01 00 00 00 03 00 00 00 02 ...>,
    FlashpixVersion: <Buffer 30 31 30 30>,
    ColorSpace: 1,
    ExifImageWidth: 2400,
    ExifImageHeight: 1800,
    InteropOffset: 926,
    FocalPlaneXResolution: 2381,
    FocalPlaneYResolution: 2381,
    FocalPlaneResolutionUnit: 3,
    SensingMethod: 2,
    FileSource: <Buffer 03>,
    SceneType: <Buffer 01>
  },
  gps: {},
  interoperability: {
    InteropIndex: 'R98',
    InteropVersion: <Buffer 30 31 30 30>
  },
  makernote: {
    Version: <Buffer 30 31 33 30>,
    Quality: 'NORMAL ',
    Sharpness: 3,
    WhiteBalance: 0,
    FujiFlashMode: 1,
    FlashExposureComp: 0,
    Macro: 0,
    FocusMode: 0,
    SlowSync: 0,
    AutoBracketing: 0,
    BlurWarning: 0,
    FocusWarning: 0,
    ExposureWarning: 0
  }
}
```

For more information about the Exif standard please refer to the specification found on [http://www.exif.org](http://www.exif.org). A comprehensive list of available Exif attributes and their meaning can be found on [http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/](http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/).

## ToDo / Ideas

There are a lot of things still to be done and to be made better. If you have any special requests please open an issue with a feature request.

## License

_node-exif_ is licensed under the MIT License. (See LICENSE)