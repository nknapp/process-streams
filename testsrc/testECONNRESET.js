var ProcessStreams = require('../src/process-streams.js')
var es = require('event-stream')
require('trace-and-clarify-if-possible')

var ps = new ProcessStreams()

module.exports.testECONNRESET = function (test) {
  test.expect(3)
  var input = require('event-stream').readable(function read (count, callback) {
    if (count > 100000000) {
      return this.emit('end')
    }
    this.emit('data', ' ' + count)
    callback()
  })

  var spawn = ps.spawn('node', ['testsrc/fixtures/econnreset.js'])
  spawn.setEncoding('utf-8')
  input
    .pipe(spawn)
    .on('input-closed', function (error) {
      test.equal(error.code, 'ECONNRESET')
    })
    .pipe(es.wait(function (err, output) {
      // Delay test for a while to let the input-closed event happen
      setTimeout(test.done, 50)
      test.equal(err, null)
      test.equal(output, 'hello', 'Checking returned result')
    }))
}

module.exports.testEPIPE = function (test) {
  var spawn2 = ps.spawn('head', ['-2'])

  spawn2.setEncoding('utf-8')
  es.readArray(['1\n', '2\n', '2\n', '2\n'])
    .pipe(spawn2)
    .on('input-closed', function (error) {
      test.equal(error.code, 'EPIPE')
    })
    .pipe(es.wait(function (err, output) {
      if (err) {
        throw err
      }
      // Delay test for a while to let the input-closed event happen
      setTimeout(test.done, 50)
      test.deepEqual(output, '1\n2\n', 'Checking returned result')
    }))
}
