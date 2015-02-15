var ProcessStreams = require("../src/process-streams.js");
var fs = require("fs");
var es = require("event-stream");
var path = require("path");
var panasonicTar = require.resolve("video-testdata/data/panasonic-lumix-dmc-zx3.tar");
var ps = new ProcessStreams();
var unpack = require('tar').Extract;
var tmpDir = require("tempfile")(".tar");
console.log(tmpDir);
var mtsFile = path.join(tmpDir, "PRIVATE", "AVCHD", "BDMV", "STREAM", "00000.MTS");


function unpackMTS(callback) {
    fs.exists(tmpDir, function (err, exists) {
        if (err) {
            return callback(err);
        }
        if (exists) {
            callback(null);
        } else {
            fs.createReadStream(panasonicTar)
                .pipe(unpack({ path: tmpDir}))
                .pipe(es.wait(callback));
        }
    });

}

module.exports.testECONNRESET = function (test) {
    test.expect(1);
    unpackMTS(function(err) {
        if (err) throw err;
        var input = fs.createReadStream(mtsFile);
        console.log(tmpDir,fs.existsSync(mtsFile));

        var spawn = ps.spawn("exiftool", ["-s3", "-MimeType", "-fast", "-"]);
        spawn.setEncoding("utf-8");
        input.pipe(spawn).on("input-closed", function (error) {
            test.equal(error.code, "ECONNRESET");
        }).pipe(es.wait(function () {
            console.log(arguments);
            test.done();
        }));
    });
};

module.exports.testEPIPE = function (test) {
    var spawn2 = ps.spawn("head", ["-2"]);

    spawn2.setEncoding("utf-8");
    es.readArray(["1\n", "2\n", "2\n", "2\n"]).pipe(spawn2).pipe(es.wait(function () {
        console.log(arguments);
        test.done();
    }));
};
