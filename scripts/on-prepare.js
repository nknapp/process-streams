const cp = require('child_process')

cp.execSync('git config core.hooksPath .git-hooks', { stdio: 'inherit' })
