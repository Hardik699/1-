import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "hr.json");

type HRShape = {
  employees: any[];
  systemAssets: any[];
  pcLaptopAssets: any[];
  itAccounts: any[];
  assetAssignments: any[];
};

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE_PATH);
  } catch {
    const initial: HRShape = {
      employees: [],
      systemAssets: [],
      pcLaptopAssets: [],
      itAccounts: [],
      assetAssignments: [],
    };
    await fs.writeFile(FILE_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readDB(): Promise<HRShape> {
  await ensureFile();
  const raw = await fs.readFile(FILE_PATH, "utf8");
  return JSON.parse(raw) as HRShape;
}

async function writeDB(db: HRShape) {
  await ensureFile();
  await fs.writeFile(FILE_PATH, JSON.stringify(db, null, 2), "utf8");
}

export const hrStore = {
  async getEmployees() {
    const db = await readDB();
    return db.employees;
  },
  async getEmployee(id: string) {
    const db = await readDB();
    return db.employees.find((e) => e.id === id) || null;
  },
  async upsertEmployee(emp: any) {
    const db = await readDB();
    const idx = db.employees.findIndex((e) => e.id === emp.id);
    if (idx >= 0) db.employees[idx] = emp;
    else db.employees.push(emp);
    await writeDB(db);
  },
  async deleteEmployee(id: string) {
    const db = await readDB();
    db.employees = db.employees.filter((e) => e.id !== id);
    await writeDB(db);
  },

  async getSystemAssets() {
    const db = await readDB();
    return db.systemAssets;
  },
  async upsertSystemAssets(items: any[]) {
    const db = await readDB();
    for (const a of items) {
      const idx = db.systemAssets.findIndex((s) => s.id === a.id);
      if (idx >= 0) db.systemAssets[idx] = { ...db.systemAssets[idx], ...a };
      else db.systemAssets.push(a);
    }
    await writeDB(db);
  },
  async replaceSystemAssets(items: any[]) {
    const db = await readDB();
    db.systemAssets = items;
    await writeDB(db);
  },

  async getItAccounts() {
    const db = await readDB();
    return db.itAccounts;
  },
  async createItAccount(a: any) {
    const db = await readDB();
    const idx = db.itAccounts.findIndex((x) => x.id === a.id);
    if (idx >= 0) db.itAccounts[idx] = a;
    else db.itAccounts.push(a);
    await writeDB(db);
  },
  async deleteItAccount(id: string) {
    const db = await readDB();
    db.itAccounts = db.itAccounts.filter((x) => x.id !== id);
    await writeDB(db);
  },

  async getPCLaptops() {
    const db = await readDB();
    return db.pcLaptopAssets;
  },
  async upsertPCLaptops(items: any[]) {
    const db = await readDB();
    for (const p of items) {
      const idx = db.pcLaptopAssets.findIndex((x) => x.id === p.id);
      if (idx >= 0) db.pcLaptopAssets[idx] = { ...db.pcLaptopAssets[idx], ...p };
      else db.pcLaptopAssets.push(p);
    }
    await writeDB(db);
  },

  async getAssignments() {
    const db = await readDB();
    return db.assetAssignments;
  },
  async addAssignment(a: any) {
    const db = await readDB();
    db.assetAssignments.push(a);
    await writeDB(db);
  },

  async seedDemo(employees: any[], assets: any[], pcs: any[], it: any[]) {
    const db = await readDB();
    db.employees = [...db.employees, ...employees];
    db.systemAssets = [...db.systemAssets, ...assets];
    db.pcLaptopAssets = [...db.pcLaptopAssets, ...pcs];
    db.itAccounts = [...db.itAccounts, ...it];
    await writeDB(db);
  },

  async wipeAll() {
    const initial: HRShape = {
      employees: [],
      systemAssets: [],
      pcLaptopAssets: [],
      itAccounts: [],
      assetAssignments: [],
    };
    await writeDB(initial);
  },
};
