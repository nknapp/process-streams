var cp = require("child_process");
var ps = require("../src/process-streams.js");
var es = require("event-stream");
var path = require("path");

require("long-stack-traces");

var source = ["ab", "b"];


function checkResult(test) {
    return function (err, target) {
        test.equal(target, "abb");
        test.done();
    }
}

exports.testSpawnPipePipe = function (test) {
    es.readArray(source).pipe(ps.spawn("cat")).pipe(es.wait(checkResult(test)));
};
exports.testSpawnTmpPipe = function (test) {
    es.readArray(source).pipe(ps.spawn("cat", [ps.IN])).pipe(es.wait(checkResult(test)));
};
exports.testSpawnPipeTmp = function (test) {
    es.readArray(source).pipe(ps.spawn("tee", [ps.OUT])).pipe(es.wait(checkResult(test)));
};
exports.testSpawnTmpTmp = function (test) {
    es.readArray(source).pipe(ps.spawn("cp", [ps.IN,ps.OUT])).pipe(es.wait(checkResult(test)));
};


exports.testExecFilePipePipe = function (test) {
    es.readArray(source).pipe(ps.execFile("cat")).pipe(es.wait(checkResult(test)));
};
exports.testExecFileTmpPipe = function (test) {
    es.readArray(source).pipe(ps.execFile("cat", [ps.IN])).pipe(es.wait(checkResult(test)));
};
exports.testExecFilePipeTmp = function (test) {
    es.readArray(source).pipe(ps.execFile("tee", [ps.OUT])).pipe(es.wait(checkResult(test)));
};
exports.testExecFileTmpTmp = function (test) {
    es.readArray(source).pipe(ps.execFile("cp", [ps.IN,ps.OUT])).pipe(es.wait(checkResult(test)));
};

exports.testExecPipePipe = function (test) {
    es.readArray(source).pipe(ps.exec("cat")).pipe(es.wait(checkResult(test)));
};
exports.testExecTmpPipe = function (test) {
    es.readArray(source).pipe(ps.exec("cat <INPUT>")).pipe(es.wait(checkResult(test)));
};
exports.testExecPipeTmp = function (test) {
    es.readArray(source).pipe(ps.exec("tee <OUTPUT>")).pipe(es.wait(checkResult(test)));
};
exports.testExecTmpTmp = function (test) {
    es.readArray(source).pipe(ps.exec("cp <INPUT> <OUTPUT>")).pipe(es.wait(checkResult(test)));
};

