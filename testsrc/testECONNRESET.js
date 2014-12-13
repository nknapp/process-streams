var ProcessStreams = require("../src/process-streams.js");
var fs = require("fs");
var es = require("event-stream");
var path = require("path");

var ps = new ProcessStreams();

module.exports.testECONNRESET = function (test) {
    // This test is disabled because the input file needed is rather large
    if (2==1) {
        test.done();
        return;
    }

    test.expect(1);
    var input = fs.createReadStream(path.join(__dirname,"testdata/largeM2tsFile.mts"));

    var spawn = ps.spawn("exiftool", ["-s3", "-MimeType", "-fast", "-"]);
    spawn.setEncoding("utf-8");
    input.pipe(spawn).on("input-closed", function (error) {
        test.equal(error.code,"ECONNRESET");
    }).pipe(es.wait(function () {
        console.log(arguments);
        test.done();
    }));
};

module.exports.testEPIPE = function (test) {
    var spawn2 = ps.spawn("head", ["-2"]);

    spawn2.setEncoding("utf-8");
    es.readArray(["1\n", "2\n", "2\n", "2\n",]).pipe(spawn2).pipe(es.wait(function () {
        console.log(arguments);
        test.done();
    }));
};
