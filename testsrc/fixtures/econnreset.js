// Process that does not read on stdin.
// This will cause an ECONNRESET-error
process.stdout.write('hello')
