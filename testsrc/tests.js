var cp = require("child_process");
var ps = require("../src/index.js");
var es = require("event-stream");

var source = ["ab", "b"];

function testProcessStream(processProvider, options, callback) {
    var dest = ps(processProvider, options);
    dest.setEncoding("utf8");
    es.readArray(source).pipe(dest).pipe(es.wait(callback));
}

exports.testPipePipe = function (test) {
    testProcessStream(function () {
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
    testProcessStream(function (input, output) {
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
    testProcessStream(function (input) {
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
    testProcessStream(function (input, output) {
        return cp.exec("cp " + input+" "+output);
    }, {
        pipeStdin: false,
        pipeStdout: false
    }, function (err, target) {
        test.equal(target, "abb");
        test.done();
    });
};