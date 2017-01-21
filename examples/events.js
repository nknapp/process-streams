var stringToStream = require('string-to-stream')

var ProcessStream = require("../");
var ps = new ProcessStream();

stringToStream('hello\n')
  .pipe(ps.spawn("cat"))
  .on("error", function (err) {
    // Handle errors
  })
  .on("input-closed", function (err) {
    // Handle ECONNRESET and EPIPE processe's stdin
  })
  .on("started", function (process, command, args) {
    // If "ps.exec" is called, 'command' contains the whole
    // resolved command and 'args' is undefined.
  })
  .on("exit", function (code, signal) {
    // see the 'child_process' documentation for the 'exit'-event.
  })
  .pipe(process.stdout);
