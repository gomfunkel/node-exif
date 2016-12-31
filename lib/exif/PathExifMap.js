var ExifImage = require('./ExifImage');

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};


module.exports = function (path, callback) {

    if (typeof path !== 'string') {
        return new Error("Path must be a string.");
    }
    if (typeof callback !== 'function') {
        return new Error("callback must be a function.");
    }
    if (!path.toLowerCase().endsWith('jpg')) {
        return new Error("Path must be a jpg.");
    }

    try {
        new ExifImage({
            image: path
        }, function (error, exifData) {

            if (error) {
                console.log(error)
            } else {
                callback(path, exifData);
            }
        });

    } catch (error) {

        console.log(error);
    }

};