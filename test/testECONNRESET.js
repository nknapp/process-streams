var ProcessStreams = require('../src/process-streams.js')
var es = require('event-stream')
var chai = require('chai')
var expect = chai.expect
var checkmark = require('chai-checkmark')
chai.use(checkmark)

var ps = new ProcessStreams()

function largeStream () {
  return require('event-stream').readable(function read (count, callback) {
    if (count > 100000000) {
      return this.emit('end')
    }
    this.emit('data', ' ' + count)
    callback()
  })
}

describe('the input-closed event', function () {
  it('should be emitted on ECONNRESET', function (done) {
    expect(3).checks(done)
    var input = largeStream()
    var spawn = ps.spawn('node', ['test/fixtures/econnreset.js'])
    spawn.setEncoding('utf-8')
    input
      .pipe(spawn)
      .on('input-closed', function (error) {
        // It's difficult to create a test that exactly provokes an
        // ECONNRESET, so we also accept EPIPE here
        if (error.code === 'EPIPE') {
          expect(error.code).to.equal('EPIPE').mark()
        } else {
          expect(error.code).to.equal('ECONNRESET').mark()
        }
      })
      .pipe(es.wait(function (err, output) {
        // Delay test for a while to let the input-closed event happen
        expect(err).to.equal(null).mark()
        expect(output).to.equal('hello', 'Checking returned result').mark()
      }))
  })

  xit('should be emitted for EPIPE-events', function (done) {
    expect(3).checks(done)

    var spawn = ps.spawn('head', ['-2'])
    spawn.setEncoding('utf-8')

    es.readArray(['1\n', '2\n', '2\n', '2\n'])
      .pipe(spawn)
      .on('input-closed', function (error) {
        expect(error.code).to.equal('EPIPE').mark()
      })
      .pipe(es.wait(function (err, output) {
        // Delay test for a while to let the input-closed event happen
        expect(err).to.equal(null).mark()
        expect(output).to.equal('1\n2\n', 'Checking returned result').mark()
      }))
  })
})
