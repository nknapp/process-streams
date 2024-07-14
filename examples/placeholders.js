const stringToStream = require('string-to-stream')

const ProcessStream = require('../')
const ps = new ProcessStream('[IN]', '[OUT]')
stringToStream('hello\n')
  .pipe(ps.exec('cp [IN] [OUT]'))
  .pipe(process.stdout)
