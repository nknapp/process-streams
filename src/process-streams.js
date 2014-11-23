'use strict';

var stream = require("stream");
var duplexer = require("duplexer2");
var fs = require("fs");
var tmp = require("tempfile");
var cp = require("child_process");
var quotemeta = require("quotemeta");

/**
 * Return first argument if it is the path of a temp file (i.e. a string), and null if it is a stream
 * @param fileOrStream
 */
function tmpFile(fileOrStream) {
    if (typeof fileOrStream === "string") {
        return fileOrStream;
    } else {
        return null;
    }
}

/**
 * Base function to create streams of something, if values are provided for tmpIn (or tmpOut),
 * these are passed to the callback function. If not, the input stream (or the output stream) are used instead.
 *
 * @param tmpIn path to a tempfile to write input stream input to before calling the callback,
 *  if this is null, the stream input is directly
 * @param tmpOut path to a tempfile to which the
 * @param callback function(err,tmpOrInputStream, tmpOrOutputStream, callback(err)) the callback is called whenever the input
 *   is available.
 * @returns {Stream}
 */
function createStream(tmpIn, tmpOut, callback) {

    var writable = new stream.PassThrough();
    var readable = new stream.PassThrough();
    // input paramter of the child process

    inStream(writable, tmpIn, function (err) {
        callback(err, tmpIn || writable, tmpOut || readable, function (err) {
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
    return duplexer(writable, readable);
}

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
            callback(null);
        });
        tmpWrite.on("error", function (error) {
            callback(error);
        });
    } else {
        callback(null);
    }
}

/**
 * Wraps a process provided by a function in a stream such that the stream input is piped to stdin and stdout is piped to the stream output.
 * If tmpIn is provided, no pipe is set up to stdin. Instead, the data is piped into tmpIn which can than be provided to the process
 * as command line argument. The same applies for stdout.
 * @param processProvider
 * @param tmpIn the location of a temporary file that is filled with the input data.
 * @param tmpOut the location of a temporary file that the process writes to and that is used as source to the stream output.
 */
function wrapProcess(tmpIn, tmpOut, processProvider) {
    return createStream(tmpIn, tmpOut, function (err, input, output, callback) {
        if (err) {
            callback(err);
        }
        var process = processProvider(tmpFile(input), tmpFile(output));
        if (!tmpIn) {
            input.pipe(process.stdin);
        }
        if (!tmpOut) {
            process.stdout.pipe(output);
        }
        process.on("exit", function () {
            callback(null);
        });
    });
}

/**
 * Parses the a child process commandline array
 * @param args a list of command line arguments (string) which may also contain IN once and OUT once.
 * @return {Object}
 * @param tmpIn temporary file for possible input data.
 * @param tmpOut temporary file for possibe output data.
 */
function parseArgs(args, tmpIn, tmpOut) {
    var resultIn = null;
    var resultOut = null;
    var resultArgs = args ? args.map(function (arg) {
        var parsed = parseString(arg, tmpIn, tmpOut);
        resultIn = resultIn || parsed.in;
        resultOut = resultOut || parsed.out;
        return parsed.string;
    }) : args;
    return {
        in: resultIn,
        out: resultOut,
        args: resultArgs
    };
}

function parseString(string, tmpIn, tmpOut) {
    var resultIn = null;
    var resultOut = null;

    var resultString = string.replace(placeHolderRegex, function (match) {
        switch (match) {
            case module.exports.IN:
                return resultIn = resultIn || tmpIn;
            case module.exports.OUT:
                return resultOut = resultOut || tmpOut;
            default:
                throw new Error("Found '" + match + "'. Placeholder regex not consistent: " + JSON.stringify(placeholders));
        }
    });

    return {
        in: resultIn,
        out: resultOut,
        string: resultString
    };
}

var placeHolderRegex = null;

module.exports = {
    IN: module.exports.IN,
    OUT: module.exports.OUT,
    /**
     * Specify new default placeholders for temporary input and output files in argument lists.
     * @param input placeholder for input file
     * @param output placeholder for output file
     */
    placeholders: function (input, output) {
        module.exports.IN = input;
        module.exports.OUT = output;
        placeHolderRegex = new RegExp("(" + quotemeta(module.exports.IN) + "|" + quotemeta(module.exports.OUT) + ")","g")
    },

    /**
     * Like child_process.spawn, but returns a through-stream instead of the child process.
     * The property "process" of the stream contains the child process
     * @param command
     * @param args
     * @param [options]
     * @param [callback]
     */
    spawn: function (command, args, options, callback) {
        var parsed = parseArgs(args, tmp(), tmp());
        return wrapProcess(parsed.in, parsed.out, function () {
            return cp.spawn(command, parsed.args, options, callback);
        });

    },
    exec: function (command, options, callback) {
        var parsed = parseString(command, tmp(), tmp());
        return wrapProcess(parsed.in, parsed.out, function () {
            return cp.exec(parsed.string, options, callback);
        });
    },
    execFile: function (command, args, options, callback) {
        var parsed = parseArgs(args, tmp(), tmp());
        return wrapProcess(parsed.in, parsed.out, function () {
            return cp.execFile(command, parsed.args, options, callback);
        });
    }

};

// Set default placeholders
module.exports.placeholders("<INPUT>", "<OUTPUT>");
