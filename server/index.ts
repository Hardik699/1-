import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { attachIdentity, requireAdmin } from "./middleware/auth";
import { salariesRouter } from "./routes/salaries";

const HAS_DB = false;

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(attachIdentity);

  // Static for uploaded files
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // DB health
  app.get("/api/db/health", async (_req, res) => {
    res.json({ connected: false, reason: "Database disabled in this build" });
  });

  // Global health
  app.get("/api/health", async (_req, res) => {
    let db = false;
    let dbError: string | undefined;
    if (HAS_DB) {
      try {
        const { pool } = await import("./data/postgres");
        await pool.query("SELECT 1");
        db = true;
      } catch (e: any) {
        db = false;
        dbError = e?.message || String(e);
      }
    }
    const sheetsConfigured = !!process.env.GOOGLE_SHEET_ID && !!process.env.GOOGLE_SA_JSON;
    res.json({ ok: true, db, dbError, sheetsConfigured });
  });

  // Salaries API
  app.use("/api/salaries", salariesRouter());

  // Config helpers (available regardless of DB)
  app.post("/api/config/test-db", async (req, res) => {
    try {
      const url = (req.body?.url || req.body?.databaseUrl || "").trim();
      if (!url)
        return res.status(400).json({ ok: false, error: "Missing url" });
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
      });
      try {
        const r = await pool.query("SELECT 1 AS ok");
        await pool.end();
        return res.json({
          ok: true,
          connected: true,
          result: r?.rows?.[0]?.ok === 1,
        });
      } catch (e: any) {
        await pool.end().catch(() => {});
        return res
          .status(400)
          .json({
            ok: false,
            connected: false,
            error: e?.message || String(e),
          });
      }
    } catch (e: any) {
      return res
        .status(500)
        .json({ ok: false, error: e?.message || "Failed to test" });
    }
  });

  // HR/IT API (mount even when DB disabled - use local file store)
  import("./routes/hr")
    .then((m) => {
      app.use("/api/hr", m.hrRouter());

      if (process.env.AUTO_WIPE_IT_HR === "1") {
        Promise.resolve(m.wipeDirect?.()).catch(() => {});
      }

      if (process.env.AUTO_SEED_DEMO === "1") {
        Promise.resolve(m.seedDemoDirect?.(10)).catch(() => {});
      }
    })
    .catch((err) => {
      console.error("Failed to initialize HR routes:", err?.message || err);
    });

  // Sheets routes (mount when service account and sheet id are configured)
  if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SA_JSON) {
    import("./routes/sheets")
      .then((m) => {
        app.use("/api/sheets", m.sheetsRouter());
      })
      .catch((err) => {
        console.error("Failed to initialize Sheets routes:", err?.message || err);
      });

    // Start periodic background job to push master data every 5 minutes (no immediate startup push)
    (async () => {
      try {
        const mod = await import("./services/googleSheets");
        // Schedule periodic push with initial delay to avoid startup API bursts
        const runPush = async () => {
          try {
            await mod.GoogleSheets.pushMasterFromFiles();
          } catch (err) {
            console.error("Periodic sheets push failed:", err?.message || err);
          }
        };
        // Start after 30s, then every 5 minutes
        setTimeout(() => {
          runPush();
          setInterval(runPush, 5 * 60 * 1000);
        }, 30 * 1000);
      } catch (e) {
        console.error("Failed to start sheets background job:", e);
      }
    })();
  }

  // One-time migration (file store -> Postgres)
  if (HAS_DB) {
    app.post(
      "/api/migrate-to-postgres",
      requireAdmin,
      async (req, res, next) => {
        try {
          const mod = await import("./routes/migrate");
          return mod.migrateSalariesToPostgres(req, res, next);
        } catch (err) {
          next(err);
        }
      },
    );
  }


  // Admin: full wipe of data (DB tables, file-store, uploads)
  app.post("/api/admin/full-wipe", requireAdmin, async (_req, res) => {
    try {
      // Clear file-store salaries.json
      const fs = await import("fs/promises");
      const dataPath = path.resolve(process.cwd(), "data", "salaries.json");
      await fs.writeFile(dataPath, JSON.stringify({ salaries: [], documents: [] }, null, 2), "utf8");

      // Clear uploads directory
      const uploadsDir = path.resolve(process.cwd(), "uploads");
      await fs.rm(uploadsDir, { recursive: true, force: true });
      await fs.mkdir(uploadsDir, { recursive: true });

      // Truncate DB tables if available
      if (HAS_DB) {
        const { pool } = await import("./data/postgres");
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
          "salary_documents",
          "salaries",
        ];
        await pool.query("BEGIN");
        for (const t of tables) {
          // skip non-existing tables
          const r = await pool.query("SELECT to_regclass($1) AS reg", [t]);
          if (r.rows?.[0]?.reg) {
            await pool.query(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE`);
          }
        }
        await pool.query("COMMIT");
      }

      res.json({ ok: true });
    } catch (e: any) {
      try {
        // best effort rollback DB if pool exists
        if (HAS_DB) {
          const { pool } = await import("./data/postgres");
          await pool.query("ROLLBACK").catch(() => {});
        }
      } catch {}
      res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
  });

  // Admin: sanitize stored files by removing id fields (one-time)
  app.post('/api/admin/sanitize-storage', requireAdmin, async (_req, res) => {
    try {
      const fs = await import('fs/promises');
      const dataDir = path.resolve(process.cwd(), 'data');
      // salaries.json
      try {
        const salariesPath = path.join(dataDir, 'salaries.json');
        const raw = await fs.readFile(salariesPath, 'utf8');
        const parsed = JSON.parse(raw || '{}');
        if (parsed.salaries) {
          parsed.salaries = parsed.salaries.map((s: any) => {
            const copy = { ...s };
            delete copy.id;
            return copy;
          });
        }
        if (parsed.documents) {
          parsed.documents = parsed.documents.map((d: any) => {
            const copy = { ...d };
            delete copy.id;
            delete copy.salaryId;
            return copy;
          });
        }
        await fs.writeFile(salariesPath, JSON.stringify(parsed, null, 2), 'utf8');
      } catch (e) {
        // ignore if missing
      }

      // hr.json
      try {
        const hrPath = path.join(dataDir, 'hr.json');
        const raw = await fs.readFile(hrPath, 'utf8');
        const parsed = JSON.parse(raw || '{}');
        const stripList = ['employees','systemAssets','pcLaptopAssets','itAccounts','assetAssignments'];
        for (const key of stripList) {
          if (Array.isArray(parsed[key])) {
            parsed[key] = parsed[key].map((obj: any) => {
              const copy = { ...obj };
              delete copy.id;
              return copy;
            });
          }
        }
        await fs.writeFile(hrPath, JSON.stringify(parsed, null, 2), 'utf8');
      } catch (e) {
        // ignore if missing
      }

      res.json({ ok: true, message: 'Sanitized storage files (ids removed)'});
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
  });

  // Admin helper: page that clears client-side localStorage/sessionStorage/indexedDB when visited
  app.get('/admin/clear-local', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Clear Local Data</title>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>body{font-family:Inter,system-ui,sans-serif;background:#0f172a;color:#e6eef8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style>
        </head>
        <body>
          <div style="max-width:760px;padding:24px;text-align:center">
            <h1>Clearing local data...</h1>
            <p id="status">Attempting to clear localStorage, sessionStorage, and IndexedDB. Please wait.</p>
            <script>
              (async function(){
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                  if (window.indexedDB && indexedDB.databases) {
                    const dbs = await indexedDB.databases();
                    await Promise.all(dbs.map(d => d.name ? indexedDB.deleteDatabase(d.name) : Promise.resolve()));
                  }
                  document.getElementById('status').textContent = 'Local data cleared successfully.';
                } catch (e) {
                  document.getElementById('status').textContent = 'Failed to clear local data: ' + (e && e.message ? e.message : String(e));
                }
              })();
            </script>
          </div>
        </body>
      </html>`);
  });

  return app;
}
