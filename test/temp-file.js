var os = require('os')
var tmpFile = require('../src/temp-file')
var quotemeta = require('../src/quotemeta')
var chai = require('chai')
var expect = chai.expect

describe('tmpFile', function () {
  it('creates a filename below os.tmpDir()', function () {
    expect(tmpFile('.in')).to.match(new RegExp('^' + quotemeta(os.tmpdir() + '/')))
  })

  it('creates a filename that ends with the suffix', function () {
    expect(tmpFile('.in')).to.match(/.in$/)
  })

  it('creates unique filenames for each call', function () {
    var generateNames = {}
    for (var i = 0; i < 1000; i++) {
      var name = tmpFile('.in')
      // eslint-disable-next-line no-unused-expressions
      expect(generateNames[name]).to.be.undefined
      generateNames[name] = true
    }
  })

  it('includes the timestamp in the name', function () {
    expect(tmpFile('.in')).to.contain('')
  })

  it("includes 'ps-' in the name", function () {
    expect(tmpFile('.in')).to.contain('ps-')
  })
})
