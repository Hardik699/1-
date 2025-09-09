import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NETLIFY_DATABASE_URL;
if (!DATABASE_URL) {
  console.error("No DATABASE_URL provided in environment");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const tables = [
  "asset_assignments",
  "it_accounts",
  "employees",
  "system_assets",
  "mice",
  "keyboards",
  "motherboards",
  "rams",
  "storages",
  "power_supplies",
  "headphones",
  "cameras",
  "monitors",
  "vonage_numbers",
  "vitel_global_numbers",
  "pc_laptop_assets",
  "salaries",
  "salary_documents",
];

async function exists(table) {
  const r = await pool.query("SELECT to_regclass($1) as reg", [table]);
  return Boolean(r.rows?.[0]?.reg);
}

async function main() {
  try {
    console.log("Starting DB wipe...");
    await pool.query("BEGIN");
    for (const t of tables) {
      if (await exists(t)) {
        console.log(`Truncating ${t}`);
        await pool.query(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE`);
      } else {
        console.log(`Table not found, skipping: ${t}`);
      }
    }
    await pool.query("COMMIT");
    console.log("Database wipe completed successfully.");
  } catch (err) {
    await pool.query("ROLLBACK").catch(() => {});
    console.error("Failed wiping DB:", err?.message || err);
    process.exitCode = 2;
  } finally {
    await pool.end().catch(() => {});
  }
}

main();
