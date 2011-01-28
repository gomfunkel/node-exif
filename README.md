node-exif
=========

With _node-exif_ you can extract Exif metadata from images (JPEG). Exif is a
format used, for example, by digital cameras and scanners to save additional
information about an image in the image file. This information can be the
camera model, resolution, where the image was taken (GPS) or when it was taken.

Installation
------------

Installing using npm (node package manager):

    npm install exif
    
If you don't have npm installed or don't want to use it:

    cd ~/.node_libraries
    git clone git://github.com/gomfunkel/node-exif.git exif

Usage
-----

Easy. Just require _node-exif_ and throw an image at it. If _node-exif_ is able to
extract data from the image it does so and returns an object with all the 
information found, if an error occurs you will receive an error message. To
prove that it really is easy please see the following example.

    var ExifImage = require('exif').ExifImage;
    
    try {
        new ExifImage({ image : 'myImage.jpg' }, function (error, image) {
            if (error)
                console.log('Error: '+error.message);
            else
                console.log(image); // Do something with your data!
        });
    } catch (error) {
        console.log('Error: ' + error);
    }

Instead of providing a filename of an image in your filesystem you can also
pass a Buffer to ExifImage.

The data returned is an object with a couple of arrays, each of the arrays
consists of the metadata extracted from the respective section. Please refer
to ExifImage.js for a list of available tags and their meaning, there is a lot
of them. This is subject to change, though, as it's not really self explanatory
right now.

ToDo / Ideas
------------

 * Testing, testing, testing
 * Performance improvements
 * Better access to extracted data
 * Fetch remote files and extract metadata from them
 * Extract makernote information
 * Enhance interoperability information
 * Add string representations for flags
 * You name it  
    
License
-------

_node-exif_ is licensed under the MIT License. (See LICENSE) 