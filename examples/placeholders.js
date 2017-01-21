var stringToStream = require('string-to-stream')

var ProcessStream = require('../')
var ps = new ProcessStream('[IN]', '[OUT]')
stringToStream('hello\n')
  .pipe(ps.exec('cp [IN] [OUT]'))
  .pipe(process.stdout)
