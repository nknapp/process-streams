'use strict';

var stream = require("stream");
var duplexer = require("duplexer2");
var fs = require("fs");
var tmp = require("tempfile");

/**
 * Create a duplex stream from a process,
 * assuming that the process writes to a temp file.
 *
 * @param {Function.<Process>} processProvider the process to wrap in the stream
 * @param {Object} options options for the function
 * @param {Boolean} options.pipeStdin true, if the process should receive the input of the resulting stream though stdin.
 *      If this is false, the process-function receives a filename as first parameter, otherwise a stream
 * @param {Boolean} options.pipeStdout true, if the output of the process should be read from its stdout the process-function
 * receives a filename as second parameter, otherwise a stream
 */
module.exports = function (processProvider, options) {
    var writeable = new stream.PassThrough();
    var readable = new stream.PassThrough();
    // input paramter of the child process
    var tmpIn = options.pipeStdin ? null : tmp();
    var tmpOut = options.pipeStdout ? null : tmp();

    inStream(writeable, tmpIn, function (err, input) {
        var process = processProvider(input, tmpOut);
        if (!tmpIn) {
            writeable.pipe(process.stdin);
        }
        if (!tmpOut) {
            process.stdout.pipe(readable);
        }
        process.on("exit", function () {
            // tmpFile is not needed anymore
            if (tmpIn) {
                fs.unlink(tmpIn);
            }
            if (tmpOut) {
                var out = fs.createReadStream(tmpOut);
                out.pipe(readable);
                out.on("end", function () {
                    fs.unlink(tmpOut);
                })
            }
        });
    });
    return duplexer(writeable, readable);
};

/**
 *
 * @param stream
 * @param tmpFile path to a temporary file. If this is set, the stream is written to the file
 *    and the file is used as parameter for the callback
 * @param callback
 */
function inStream(stream, tmpFile, callback) {
    if (tmpFile) {
        var tmpWrite = fs.createWriteStream(tmpFile);
        stream.pipe(tmpWrite);
        tmpWrite.on("finish", function () {
            callback(null, tmpFile);
        });
        tmpWrite.on("error", function (error) {
            callback(error);
        });
    } else {
        callback(null, stream);
    }
}
