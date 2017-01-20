// Process that does not read on stdin.
// This will cause an ECONNRESET-error
setTimeout(function() {
  process.stdout.write('hello')
},10)
