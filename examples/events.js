const stringToStream = require('string-to-stream')

const ProcessStream = require('../')
const ps = new ProcessStream()

stringToStream('hello\n')
  .pipe(ps.spawn('cat'))
  .on('error', function (err) {
    // Handle errors
    console.log('error', err)
  })
  .on('input-closed', function (err) {
    // Handle ECONNRESET and EPIPE processe's stdin
    console.log('input-closed', err)
  })
  .on('started', function (process, command, args) {
    // If "ps.exec" is called, 'command' contains the whole
    // resolved command and 'args' is undefined.
  })
  .on('exit', function (code, signal) {
    // see the 'child_process' documentation for the 'exit'-event.
  })
  .pipe(process.stdout)
