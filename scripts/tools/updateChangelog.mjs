import { editFile } from './editFile.mjs'
import fs from 'node:fs/promises'

export async function updateChangelog () {
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'))

  return await editFile('CHANGELOG.md', (contents) => {
    return contents.replace(
      '# Upcoming\n',
            `# Upcoming

# v${packageJson.version}

Date: ${new Date().toISOString()}

`
    )
  })
}
