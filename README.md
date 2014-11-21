Motivation
==========

The goal of this small package is to provide a interface for streaming data to
and from child-processes. It may be possible to stream data to a process via stdout
and read the result from stdin, but it may also be necessary to store the data in a
temporary file and provide the filename to the process as argument.

A concrete example is ffmpeg: It is possible to encode webm-videos to a stream,
but h264 must always be stored in a temporary file first. On the other hand in some cases
[it is not possible to stream data into ffmpeg](http://superuser.com/questions/822500/pipe-issue-with-ffmpeg),
so data must be stored in a temporary file prior to calling ffmpeg.



Usage
=====

require('process-streams')(function,options)
---------------------------------------------

Creates a readable/writable stream wrapping a child-process.

`function` must create and return the child process that should be wrapped. The arguments
depend on the provided options:

If `options.pipeStdin` is `false`, the first parameter of `function` is a path to a temporary file
containing the data piped into the stream. The `function` is called once the data is completely
written to the file. The file is deleted after the child-process has exited.

If `options.pipeStdout` is `false`, the second parameter of `function` is a path to a temporary file.
Once the created process exits, this contents of this file is piped through the readable part of the stream.
The file is deleted after all the data has been streamed.

Note the `options` is not optional at the moment.

Examples
========
* Use temporary file as input ("cat tmpfile >out")
``` js

   var cp = require("child_process");
   var ps = require("process-streams");
   var stream = ps(function (input, output) {
       return cp.exec("cat " + input);
   }, {pipeStdin: false, pipeStdout: true});
   process.stdin.pipe(stream).pipe(process.stdout);
```

* Use temporary file as output ("tee tmpfile <in")
``` js
   var cp = require("child_process");
   var ps = require("process-streams");
   var stream = ps(function (input, output) {
       return cp.exec("tee " + output);
   }, {pipeStdin: true, pipeStdout: false});
   process.stdin.pipe(stream).pipe(process.stdout);
```

* Use temporary file for both input and ouput ("cp source target")
``` js
   var cp = require("child_process");
   var ps = require("process-streams");
   var stream = ps(function (input, output) {
       return cp.exec("cp " + input + " " + output);
   }, {pipeStdin: false, pipeStdout: false});
   process.stdin.pipe(stream).pipe(process.stdout);
```

* Use no temporary files ("cat &lt;in >out")
``` js
   var cp = require("child_process");
   var ps = require("process-streams");
   var stream = ps(function (input, output) {
       return cp.exec("cat");
   }, {pipeStdin: true, pipeStdout: true});
   process.stdin.pipe(stream).pipe(process.stdout);
```


Please note that this api is still experimental. Feedback is welcome although I cannot guarantee any response times at the moment.
