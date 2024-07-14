var ProcessStreams = require('../src/process-streams.js')
var es = require('event-stream')
var fs = require('fs')
var chai = require('chai')
var expect = chai.expect
var checkmark = require('chai-checkmark')
chai.use(checkmark)

var ps = new ProcessStreams()
var source = ['ab', 'b']

function checkResult (done) {
  expect(2).checks(done)
  return function (err, target) {
    expect(err).to.be.null.mark()
    expect(target).to.equal('abb').mark()
  }
}

var functions = {
  Spawn: {
    func: ps.spawn,
    params: function (command, args) {
      return [command, args]
    }
  },
  ExecFile: {
    func: ps.execFile,
    params: function (command, args) {
      return [command, args]
    }
  },
  Exec: {
    func: ps.exec,
    params: function (command, args) {
      return [[command].concat(args).join(' ')]
    }
  }
}

var variants = {
  PipePipe: ['cat'],
  TmpPipe: ['cat', ['<INPUT>']],
  PipeTmp: ['tee', ['<OUTPUT>']],
  TmpTmp: ['cp', ['<INPUT>', '<OUTPUT>']]
}

describe('The ProcessStreams', function () {
  Object.keys(functions).forEach(function (f) {
    var func = functions[f].func
    var paramsTransformer = functions[f].params
    Object.keys(variants).forEach(function (v) {
      var params = paramsTransformer.apply(this, variants[v])

      /**
       * Test standard usage for each function and variant
       */
      it('testDefault' + f + v, function (done) {
        expect(2).checks(done)
        var spawn = func.apply(ps, params)
        spawn.setEncoding('utf-8')

        es.readArray(source)
          .pipe(spawn)
          .pipe(es.wait(function (err, target) {
            expect(err).to.be.null.mark()
            expect(target).to.equal('abb').mark()
          }))
      })

      /**
       * Verify the emiting of "started"-event
       */
      it('testStartedEvent' + f + v, function (done) {
        expect(5).checks(done)
        es.readArray(source).pipe(func.apply(this, params)).on('started', function () {
          expect(Object.hasOwnProperty.call(arguments[0], 'pid'), 'First argument should be a child_process object.').to.be.ok.mark()
        }).on('exit', function (code, signal) {
          expect(code, 'Checking return code').to.equal(0).mark()
          expect(signal, 'Checking signal parameter').not.to.be.ok.mark()
          expect(true).to.be.ok.mark()
        }).pipe(es.wait(function () {
          expect(true).to.be.ok.mark()
        }))
      })

      /**
       * Verify the emiting of "error"-event
       */
      it('testErrorEvent' + f + v, function (done) {
        expect(1).check(done)
        es.readArray(source).pipe(func.call(this, params[0] + 'xxxxx', params[1])).on('error', function (error) {
          expect(error, 'Must receive error event but received ' + error).to.be.ok.mark()
        }).pipe(es.wait(function (err) {
          // eslint-disable-next-line no-unused-expressions
          expect(err, 'Must not reach this block').to.be.null
        }))
      })

      /**
       * An error must be emitted, when the process did not create the output temp file.
       */
      if (v.match(/Tmp$/)) {
        it('testNoWriteToTmpFile' + f + v, function (done) {
          expect(1).check(done)
          var params = paramsTransformer.call(this, 'echo', variants[v][1])
          es.readArray(source).pipe(func.apply(this, params)).on('error', function () {
            expect(true, 'First argument should be a child_process object.').to.be.ok.mark()
          }).pipe(es.wait(function (err) {
            expect(err).to.be.null.mark()
          }))
        })
      }
    })
  })

  it('testChangePlaceHolders', function (test) {
    var ps = new ProcessStreams('[IN]', '[OUT]')
    expect(ps.IN, 'Checking input placeholder').to.equal('[IN]')
    expect(ps.OUT, 'Checking output placeholder').to.equal('[OUT]')
    var spawn = ps.exec('cp [IN] [OUT]')
    spawn.setEncoding('utf-8')
    es.readArray(source).pipe(spawn).pipe(es.wait(checkResult(test)))
  })

  function wrapper (input, output, callback) {
    if (typeof input === 'string') {
      input = fs.createReadStream(input)
    }
    if (typeof output === 'string') {
      output = fs.createWriteStream(output)
      output.on('error', callback)
      output.on('finish', function () {
        callback()
      })
    } else {
      callback()
    }
    input.pipe(output)
  }

  it('testFactoryPipePipe', function (done) {
    var spawn = ps.factory(false, false, wrapper)
    spawn.setEncoding('utf-8')
    es.readArray(source).pipe(spawn).pipe(es.wait(checkResult(done)))
  })

  it('testFactoryTmpPipe', function (done) {
    var spawn = ps.factory(true, false, wrapper)
    spawn.setEncoding('utf-8')
    es.readArray(source).pipe(spawn).pipe(es.wait(checkResult(done)))
  })

  it('testFactoryPipeTmp', function (done) {
    var spawn = ps.factory(true, false, wrapper)
    spawn.setEncoding('utf-8')
    es.readArray(source).pipe(spawn).pipe(es.wait(checkResult(done)))
  })

  it('testFactoryTmpTmp', function (done) {
    var spawn = ps.factory(true, false, wrapper)
    spawn.setEncoding('utf-8')
    es.readArray(source).pipe(spawn).pipe(es.wait(checkResult(done)))
  })
})
