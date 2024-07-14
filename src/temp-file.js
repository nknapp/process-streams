var os = require('os')
var crypto = require('crypto')

module.exports = function tmpFile (suffix) {
  var timestamp = new Date().toISOString().replace(/[:\-Z]/g, '').replace('T', '-').slice(0, 15)
  var random = crypto.randomBytes(8).toString('hex')
  return os.tmpdir() + '/ps-' + timestamp + '-' + random + suffix
}
