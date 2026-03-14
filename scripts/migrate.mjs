import pg from "pg"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const DB_URL = "postgresql://postgres:pass@@@@12345vcdijfjei@db.wywfusrvbtuhjvvwawrd.supabase.co:5432/postgres"

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
})

const migrations = [
  "../supabase/migrations/001_schema.sql",
  "../supabase/migrations/002_rls.sql",
  "../supabase/migrations/003_storage.sql",
]

async function run() {
  await client.connect()
  console.log("✅ Connected to database")

  for (const file of migrations) {
    const filePath = join(__dirname, file)
    const sql = readFileSync(filePath, "utf8")
    const name = file.split("/").pop()
    try {
      await client.query(sql)
      console.log(`✅ Ran ${name}`)
    } catch (err) {
      if (err.message.includes("already exists") || err.message.includes("duplicate")) {
        console.log(`⚠️  ${name} — some objects already exist, skipping`)
      } else {
        console.error(`❌ ${name} failed:`, err.message)
      }
    }
  }

  await client.end()
  console.log("✅ Migrations complete!")
}

run().catch((err) => {
  console.error("Fatal:", err.message)
  process.exit(1)
})
