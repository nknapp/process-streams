import cp from 'child_process'
import { checkChangelog } from './tools/checkChangelog.mjs'

cp.execSync('npm run test', { stdio: 'inherit' })
await checkChangelog()
