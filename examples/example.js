const stringToStream = require('string-to-stream')

const ProcessStream = require('../')
const ps = new ProcessStream()

// This basically pipes the stream as-is to stdout
// through multiple variations of process-streams

// Temporary files for input and output
stringToStream('hello\n')
  .pipe(ps.exec('cp <INPUT> <OUTPUT>'))
  .pipe(ps.spawn('cp', ['<INPUT>', '<OUTPUT>']))
  .pipe(ps.execFile('cp', ['<INPUT>', '<OUTPUT>']))

  // Stream input, use temp-file for output
  .pipe(ps.spawn('tee', ['<OUTPUT>']))

  // Temp-file for input, Stream for output
  .pipe(ps.spawn('cat', ['<INPUT>']))

  // Pipe both sides
  .pipe(ps.spawn('cat'))

  // Result to stdout
  .pipe(process.stdout)
