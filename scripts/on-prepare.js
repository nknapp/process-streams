const cp = require('child_process')

cp.exec('git config core.hooksPath .git-hooks', { stdio: 'inherit' }, error => {
    if (error) {
        console.error(error)
        process.exit(1)
    }
})
