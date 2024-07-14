import fs from 'node:fs/promises'

export async function checkChangelog () {
  const changelog = await fs.readFile('./CHANGELOG.md', 'utf-8')
  const upcomingMatch = changelog.match(/# Upcoming([\S\s]*?)# v/)
  if (!upcomingMatch) {
    console.error("No 'Upcoming' section found in CHANGELOG")
    process.exit(1)
  }

  if (upcomingMatch[1].match(/^\s*$/)) {
    console.error('Changelog entries for current release must be added before version bump')
  }
  console.error('Changelog is OK')
}
