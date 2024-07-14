import cp from 'child_process'
import { updateChangelog } from './tools/updateChangelog.mjs'

cp.execSync('npm run test', { stdio: 'inherit' })
await updateChangelog
