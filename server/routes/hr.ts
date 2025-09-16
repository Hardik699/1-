import { Router } from "express";
import { nanoid } from "nanoid";
import { hrStore } from "../data/hrStore";
import { requireAdmin } from "../middleware/auth";

export function hrRouter() {
  const router = Router();

  router.post("/seed-demo", requireAdmin, async (req, res, next) => {
    try {
      const count = Math.max(1, Math.min(100, Number(req.query.count) || 10));
      const employees: any[] = [];
      const assets: any[] = [];
      const pcs: any[] = [];
      const it: any[] = [];
      const nowIso = new Date().toISOString();
      for (let i = 0; i < count; i++) {
        const id = nanoid(12);
        employees.push({
          id,
          fullName: `Demo User ${String(i + 1).padStart(2, "0")}`,
          email: `demo${i + 1}@example.com`,
          department: "Engineering",
          status: "active",
          tableNumber: String((i % 20) + 1),
          createdAt: nowIso,
        });
        // create a sample asset
        const assetId = nanoid(12);
        assets.push({
          id: assetId,
          category: "mouse",
          serialNumber: `SN-${Date.now()}-${i}`,
          vendorName: ["Logitech", "HP", "Dell"][i % 3],
          companyName: "Demo Corp",
          purchaseDate: nowIso.slice(0, 10),
          warrantyEndDate: new Date(Date.now() + 365 * 24 * 3600 * 1000)
            .toISOString()
            .slice(0, 10),
          createdAt: nowIso,
        });
      }
      await hrStore.seedDemo(employees, assets, pcs, it);
      res.json({ message: "Seeded demo data", employees: employees.length });
    } catch (e) {
      next(e);
    }
  });

  router.get("/employees", async (_req, res) => {
    const items = await hrStore.getEmployees();
    const sanitized = (items || []).map((it) => {
      const copy = { ...it };
      delete copy.id;
      return copy;
    });
    res.json({ items: sanitized });
  });

  router.post("/employees", requireAdmin, async (req, res, next) => {
    try {
      const body = req.body || {};
      const employeeId = body.employeeId || `EMP${Date.now().toString().slice(-6)}`;
      const id = body.id || nanoid(12);
      const employee = {
        id,
        employeeId,
        fullName: body.fullName || body.name || "Unnamed",
        email: body.email || `${employeeId}@example.com`,
        department: body.department || "General",
        status: body.status || "active",
        tableNumber: body.tableNumber || null,
        profile: body.profile || {},
        createdAt: new Date().toISOString(),
      };
      await hrStore.upsertEmployee(employee);
      res.status(201).json({ employeeId });
    } catch (e) {
      next(e);
    }
  });

  router.put("/employees/:key", requireAdmin, async (req, res, next) => {
    try {
      const { key } = req.params;
      const existing = await hrStore.getEmployee(key);
      if (!existing) return res.status(404).json({ error: "Not found" });
      const payload = req.body || {};
      const updated = { ...existing, ...payload };
      await hrStore.upsertEmployee(updated);
      res.json({ employeeId: updated.employeeId });
    } catch (e) {
      next(e);
    }
  });

  router.get("/assets", async (_req, res) => {
    const items = await hrStore.getSystemAssets();
    const sanitized = (items || []).map((it) => {
      const copy = { ...it };
      delete copy.id;
      return copy;
    });
    res.json({ items: sanitized });
  });

  router.post("/assets/upsert-batch", requireAdmin, async (req, res, next) => {
    try {
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      await hrStore.upsertSystemAssets(items);
      res.json({ upserted: items.length });
    } catch (e) {
      next(e);
    }
  });

  router.get("/it-accounts", async (_req, res) => {
    const items = await hrStore.getItAccounts();
    const sanitized = (items || []).map((it) => {
      const copy = { ...it };
      delete copy.id;
      return copy;
    });
    res.json({ items: sanitized });
  });

  router.post("/it-accounts", requireAdmin, async (req, res, next) => {
    try {
      const payload = { ...req.body };
      if (!payload.id) payload.id = Date.now().toString();
      if (!payload.employeeId && req.body?.employeeId) payload.employeeId = req.body.employeeId;
      payload.createdAt = new Date().toISOString();
      await hrStore.createItAccount(payload);
      res.status(201).json({ employeeId: payload.employeeId, systemId: payload.systemId });
    } catch (e) {
      next(e);
    }
  });

  router.delete("/it-accounts/:key", requireAdmin, async (req, res, next) => {
    try {
      const { key } = req.params;
      await hrStore.deleteItAccount(key);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.post("/pc-laptops/upsert-batch", requireAdmin, async (req, res, next) => {
    try {
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      await hrStore.upsertPCLaptops(items);
      res.json({ upserted: items.length });
    } catch (e) {
      next(e);
    }
  });

  router.get("/assignments", async (_req, res) => {
    const items = await hrStore.getAssignments();
    const sanitized = (items || []).map((it) => {
      const copy = { ...it };
      delete copy.id;
      return copy;
    });
    res.json({ items: sanitized });
  });

  router.post("/admin/wipe", requireAdmin, async (_req, res, next) => {
    try {
      await hrStore.wipeAll();
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.post("/admin/backfill-asset-categories", requireAdmin, async (_req, res) => {
    // No-op for local store
    res.json({ ok: true, mirrored: 0 });
  });

  return router;
}
