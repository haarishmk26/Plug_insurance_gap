import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import pg from 'pg'

const { Client } = pg

async function loadEnvFile(path = '.env') {
  const envPath = resolve(process.cwd(), path)
  const content = await readFile(envPath, 'utf8')

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const equalsIndex = line.indexOf('=')
    if (equalsIndex === -1) continue

    const key = line.slice(0, equalsIndex).trim()
    const value = line.slice(equalsIndex + 1).trim()

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

async function main() {
  await loadEnvFile()

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing. Add it to .env before running npm run db:migrate.')
  }

  const migrationPath = resolve(process.cwd(), 'supabase/migrations/20260425000000_initial.sql')
  const sql = await readFile(migrationPath, 'utf8')

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  try {
    await client.query(sql)
    console.log('Applied Supabase migration: 20260425000000_initial.sql')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
