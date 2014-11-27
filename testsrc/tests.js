var cp = require("child_process");
var ProcessStreams = require("../src/process-streams.js");
var ps = new ProcessStreams();
var es = require("event-stream");
var path = require("path");
var fs= require("fs");

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
    es.readArray(source).pipe(ps.spawn("cat", ["<INPUT>"])).pipe(es.wait(checkResult(test)));
};
exports.testSpawnPipeTmp = function (test) {
    es.readArray(source).pipe(ps.spawn("tee", ["<OUTPUT>"])).pipe(es.wait(checkResult(test)));
};
exports.testSpawnTmpTmp = function (test) {
    es.readArray(source).pipe(ps.spawn("cp", ["<INPUT>","<OUTPUT>"])).pipe(es.wait(checkResult(test)));
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


exports.testChangePlaceHolders = function (test) {
    var ps = new ProcessStreams("[IN]","[OUT]");
    es.readArray(source).pipe(ps.exec("cp [IN] [OUT]")).pipe(es.wait(checkResult(test)));
};



function wrapper(input,output,callback) {
    if (typeof(input)==="string") {
        input = fs.createReadStream(input);
    }
    if (typeof(output)==="string") {
        output = fs.createWriteStream(output);
        output.on("error",callback);
        output.on("finish",function() {
            callback();
        });
    } else {
        callback();
    }
    input.pipe(output);
}

exports.testFactoryPipePipe = function (test) {
    es.readArray(source).pipe(ps.factory(false,false,wrapper)).pipe(es.wait(checkResult(test)));
};
exports.testFactoryTmpPipe = function (test) {
    es.readArray(source).pipe(ps.factory(true,false, wrapper)).pipe(es.wait(checkResult(test)));
};
exports.testFactoryPipeTmp = function (test) {
    es.readArray(source).pipe(ps.factory(true,false, wrapper)).pipe(es.wait(checkResult(test)));
};
exports.testFactoryTmpTmp = function (test) {
    es.readArray(source).pipe(ps.factory(true,false, wrapper)).pipe(es.wait(checkResult(test)));
};
