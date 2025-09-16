import { Router } from "express";
import path from "path";
import { promises as fs } from "fs";
import { requireAdmin } from "../middleware/auth";
import { GoogleSheets } from "../services/googleSheets";

export function sheetsRouter() {
  const router = Router();

  router.post("/append", requireAdmin, async (req, res, next) => {
    try {
      const { sheet, rows } = req.body || {};
      if (!sheet || !Array.isArray(rows)) return res.status(400).json({ ok: false, error: "Missing sheet or rows" });
      await GoogleSheets.appendValues(String(sheet), rows);
      res.json({ ok: true });
    } catch (e: any) {
      next(e);
    }
  });

  // Push master data (employees, system assets) to sheets (overwrite per-sheet)
  router.post("/push-master", requireAdmin, async (_req, res, next) => {
    try {
      const dataDir = path.resolve(process.cwd(), "data");
      const hrPath = path.join(dataDir, "hr.json");
      const salariesPath = path.join(dataDir, "salaries.json");

      const hrRaw = await fs.readFile(hrPath, "utf8").catch(() => "{}");
      const salariesRaw = await fs.readFile(salariesPath, "utf8").catch(() => "{}");
      const hr = JSON.parse(hrRaw || "{}");
      const salaries = JSON.parse(salariesRaw || "{}");

      // Build Employees sheet rows (header + rows)
      const employees = Array.isArray(hr.employees) ? hr.employees : [];
      const empHeaders = [Object.keys(employees[0] || {})];
      const empRows = employees.map((e: any) => empHeaders[0].map((k: string) => (e?.[k] ?? "")));

      // Build System_Assets sheet
      const sys = Array.isArray(hr.systemAssets) ? hr.systemAssets : [];
      const sysHeaders = [Object.keys(sys[0] || {})];
      const sysRows = sys.map((s: any) => sysHeaders[0].map((k: string) => (s?.[k] ?? "")));

      // Optionally include salaries as a sheet
      const sal = Array.isArray(salaries.salaries) ? salaries.salaries : [];
      const salHeaders = [Object.keys(sal[0] || {})];
      const salRows = sal.map((r: any) => salHeaders[0].map((k: string) => (r?.[k] ?? "")));

      // Clear and append for each sheet (clear -> write header -> append rows)
      // Note: GoogleSheets.appendValues uses append; we clear first to overwrite
      if (empHeaders[0].length > 0) {
        await GoogleSheets.clearSheet("Employees");
        await GoogleSheets.appendValues("Employees", [empHeaders[0], ...empRows]);
      }
      if (sysHeaders[0].length > 0) {
        await GoogleSheets.clearSheet("System_Assets");
        await GoogleSheets.appendValues("System_Assets", [sysHeaders[0], ...sysRows]);
      }
      if (salHeaders[0].length > 0) {
        await GoogleSheets.clearSheet("Salaries");
        await GoogleSheets.appendValues("Salaries", [salHeaders[0], ...salRows]);
      }

      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
