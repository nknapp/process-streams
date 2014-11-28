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
 * @param callback function(tmpOrInputStream, tmpOrOutputStream, callback(err)) the callback is called whenever the input
 *   is available.
 * @returns {Stream}
 */
function createStream(tmpIn, tmpOut, callback) {

    var incoming = new stream.PassThrough();
    var outgoing = new stream.PassThrough();
    // input paramter of the child process

    inStream(incoming, tmpIn, function (err) {
        if (err) {
            outgoing.emit("error", err);
        } else {
            callback(tmpIn || incoming, tmpOut || outgoing, function (err) {
                if (err) {
                    outgoing.emit("error", err);
                    if (tmpIn) {
                        fs.exists(tmpIn, function(exists) {
                            if (exists) {
                                fs.unlink(tmpIn);
                            }
                        });
                    }
                    if (tmpOut) {
                        fs.exists(tmpOut, function(exists) {
                            if (exists) {
                                fs.unlink(tmpOut);
                            }
                        });
                    }
                    return;
                }
                // tmpFile is not needed anymore
                if (tmpIn) {
                    fs.unlink(tmpIn);
                }
                if (tmpOut) {
                    var out = fs.createReadStream(tmpOut);
                    out.pipe(outgoing);
                    out.on("end", function () {
                        fs.unlink(tmpOut);
                    });
                }
            });
        }
    });
    return duplexer(incoming, outgoing);
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
    return createStream(tmpIn, tmpOut, function (input, output, callback) {
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
 * Create a new ProcessStreams instance optionally providing placeholder for &lt;INPUT> and &lt;OUTPUT>
 * @param [IN] placeholder for input file
 * @param [OUT] placeholder for output file
 */
module.exports = function (IN, OUT) {
    // Expose IN and OUT to the public, but use local variables internally
    this.IN = IN = IN || "<INPUT>";
    this.OUT = OUT = OUT || "<OUTPUT>";
    var placeHolderRegex = new RegExp("(" + quotemeta(IN) + "|" + quotemeta(OUT) + ")", "g");

    /**
     * Replace placeholders in command line arguments (array)
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

    /**
     * Replace placeholders in a string
     * @param string
     * @param tmpIn
     * @param tmpOut
     * @returns {{in: *, out: *, string: (XML|string|void|*)}}
     */
    function parseString(string, tmpIn, tmpOut) {
        var resultIn = null;
        var resultOut = null;
        var resultString = string.replace(placeHolderRegex, function (match) {
            switch (match) {
                case IN:
                    return resultIn = resultIn || tmpIn;
                case OUT:
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

    /**
     * Like child_process.spawn, but returns a through-stream instead of the child process.
     * The property "process" of the stream contains the child process
     * @param command
     * @param args
     * @param [options]
     * @param [callback]
     */
    this.spawn = function (command, args, options, callback) {
        var parsed = parseArgs(args, tmp(".in"), tmp(".out"));
        return wrapProcess(parsed.in, parsed.out, function () {
            return cp.spawn(command, parsed.args, options, callback);
        });

    };
    this.exec = function (command, options, callback) {
        var parsed = parseString(command, tmp(".in"), tmp(".out"));
        return wrapProcess(parsed.in, parsed.out, function () {
            return cp.exec(parsed.string, options, callback);
        });
    };
    this.execFile = function (command, args, options, callback) {
        var parsed = parseArgs(args, tmp(".in"), tmp(".out"));
        return wrapProcess(parsed.in, parsed.out, function () {
            return cp.execFile(command, parsed.args, options, callback);
        });
    };
    /**
     * Creates a stream using a factory function that connects input and output.
     * @param useTmpIn {boolean} whether to use a temp file as input
     * @param useTmpOut {boolean} whether to use a temp file as output
     * @param callback {function(err:Error,input,output,callback)} callback method that connects the input to the output somehow.
     *  Depending on the useTmpIn and useTmpOut parameter, the input and output parameters of the callback are either strings pointing
     *  to files or streams.
     */
    this.factory = function (useTmpIn, useTmpOut, callback) {
        return createStream(useTmpIn && tmp(".in"), useTmpOut && tmp(".out"), callback);
    };

};



