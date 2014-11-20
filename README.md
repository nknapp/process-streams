Usage

    var ps = require("process-stream");
    var stream = ps(function (input, output) {
            return cp.exec("cat "+input);
        }, {
            pipeStdin: false,
            pipeStdout: true
        });

    process.stdin.pipe(stream).pipe(process.stdout);

Kinda like this.
More docs coming soon.