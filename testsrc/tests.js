var cp = require("child_process");
var ps = require("../src/index.js");
var es = require("event-stream");
var stream = require("stream");
var fs = require("fs");

var source = ["ab", "b"];

function testFunction(processProvider, options, callback) {
    var dest = ps(processProvider, options);
    dest.setEncoding("utf8");
    es.readArray(source).pipe(dest).pipe(es.wait(function (err, target) {
        callback(err, target);
    }));
}

exports.testPipePipe = function (test) {
    testFunction(function (input, output) {
        return cp.exec("tee");
    }, {
        pipeStdin: true,
        pipeStdout: true
    }, function (err, target) {
        test.equal(target, "abb");
        test.done();
    });
};

exports.testPipeTmp = function (test) {
    testFunction(function (input, output) {
        return cp.exec("tee "+output);
    }, {
        pipeStdin: true,
        pipeStdout: false
    }, function (err, target) {
        test.equal(target, "abb");
        test.done();
    });
};

exports.testTmpPipe = function (test) {
    testFunction(function (input, output) {
        return cp.exec("cat "+input);
    }, {
        pipeStdin: false,
        pipeStdout: true
    }, function (err, target) {
        test.equal(target, "abb");
        test.done();
    });
};

exports.testTmpTmp = function (test) {
    testFunction(function (input, output) {
        var exec = cp.exec("cat " + input);
        exec.stdout.pipe(fs.createWriteStream(output));
        return exec;
    }, {
        pipeStdin: false,
        pipeStdout: false
    }, function (err, target) {
        test.equal(target, "abb");
        test.done();
    });
};