import { google } from "googleapis";

import path from "path";
import { promises as fs } from "fs";

export class GoogleSheets {
  static async getSheetsClient() {
    const saJson = process.env.GOOGLE_SA_JSON;
    if (!saJson) throw new Error("GOOGLE_SA_JSON not set");
    const sa = JSON.parse(saJson);
    const jwt = new google.auth.JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    } as any);

    await jwt.authorize();
    return google.sheets({ version: "v4", auth: jwt });
  }

  static async appendValues(sheetName: string, rows: any[][]) {
    if (!process.env.GOOGLE_SHEET_ID) throw new Error("GOOGLE_SHEET_ID not set");
    const sheets = await this.getSheetsClient();
    const range = `${sheetName}`; // append to sheet by name
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range,
      valueInputOption: "RAW",
      requestBody: { values: rows },
    });
  }

  static async clearSheet(sheetName: string) {
    if (!process.env.GOOGLE_SHEET_ID) throw new Error("GOOGLE_SHEET_ID not set");
    const sheets = await this.getSheetsClient();
    const range = `${sheetName}`;
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range,
    });
  }

  // Push master data from local files (data/hr.json, data/salaries.json) to configured sheets
  static async pushMasterFromFiles() {
    if (!process.env.GOOGLE_SHEET_ID) throw new Error("GOOGLE_SHEET_ID not set");
    const dataDir = path.resolve(process.cwd(), "data");
    const hrPath = path.join(dataDir, "hr.json");
    const salariesPath = path.join(dataDir, "salaries.json");

    const hrRaw = await fs.readFile(hrPath, "utf8").catch(() => "{}");
    const salariesRaw = await fs.readFile(salariesPath, "utf8").catch(() => "{}");
    const hr = JSON.parse(hrRaw || "{}");
    const salaries = JSON.parse(salariesRaw || "{}");

    const employees = Array.isArray(hr.employees) ? hr.employees : [];
    const sys = Array.isArray(hr.systemAssets) ? hr.systemAssets : [];
    const sal = Array.isArray(salaries.salaries) ? salaries.salaries : [];

    const sheets = await this.getSheetsClient();

    const ensureSheetExists = async (name: string) => {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID! });
      const sheetsList = meta.data.sheets?.map((s: any) => s.properties?.title) || [];
      if (!sheetsList.includes(name)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: process.env.GOOGLE_SHEET_ID!,
          requestBody: {
            requests: [
              { addSheet: { properties: { title: name } } },
            ],
          },
        });
      }
    };

    const fmt = (v: any) => {
      if (v === null || v === undefined) return "";
      if (typeof v === "object") {
        try {
          return JSON.stringify(v);
        } catch (e) {
          return String(v);
        }
      }
      return String(v);
    };

    const writeSheet = async (name: string, rows: any[][]) => {
      // Ensure the sheet/tab exists
      await ensureSheetExists(name);
      // Clear then write header+rows
      const clearRange = `${name}!A1:Z1000`;
      const appendRange = `${name}!A1`;
      await sheets.spreadsheets.values.clear({
        spreadsheetId: process.env.GOOGLE_SHEET_ID!,
        range: clearRange,
      });
      if (rows.length > 0) {
        // Ensure all values are strings
        const safeRows = rows.map((r) => r.map((c) => fmt(c)));
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID!,
          range: appendRange,
          valueInputOption: "RAW",
          requestBody: { values: safeRows },
        });
      }
    };

    // Employees
    if (employees.length > 0) {
      const headers = Object.keys(employees[0]);
      const rows = employees.map((e: any) => headers.map((h) => e?.[h] ?? ""));
      await writeSheet("Employees", [headers, ...rows]);
    }

    // System assets
    if (sys.length > 0) {
      const headers = Object.keys(sys[0]);
      const rows = sys.map((s: any) => headers.map((h) => s?.[h] ?? ""));
      await writeSheet("System_Assets", [headers, ...rows]);

      // Category-specific sheets (Category_<name>)
      const categories = Array.from(new Set(sys.map((s: any) => String(s.category || '').trim()).filter(Boolean)));
      for (const cat of categories) {
        const rowsForCat = sys.filter((s: any) => String(s.category || '').trim() === cat);
        if (rowsForCat.length === 0) continue;
        // normalize rows: keep vendor, company, serialNumber, purchaseDate, warrantyEndDate, createdAt
        const normalized = rowsForCat.map((r: any) => ({
          id: r.id,
          category: r.category,
          vendor: r.vendorName || r.vendor || "",
          company: r.companyName || r.company || "",
          serialNumber: r.serialNumber || r.serial || "",
          purchaseDate: r.purchaseDate || "",
          warrantyEndDate: r.warrantyEndDate || r.warranty || r.warrantyEnd || "",
          number: r.vonageNumber || r.vitelNumber || r.number || "",
          extCode: r.vonageExtCode || r.vitelExtCode || r.ext_code || "",
          createdAt: r.createdAt || "",
        }));
        const catHeaders = Object.keys(normalized[0]);
        const catRows = normalized.map((nr: any) => catHeaders.map((h) => nr[h] ?? ""));
        const sheetName = `Category_${String(cat)}`.substring(0, 31);
        await writeSheet(sheetName, [catHeaders, ...catRows]);
      }
    }

    // IT Accounts
    if (Array.isArray(hr.itAccounts) && hr.itAccounts.length > 0) {
      const itFlat = hr.itAccounts.map((r: any) => ({
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        systemId: r.systemId,
        department: r.department,
        tableNumber: r.tableNumber,
        vitelProvider: r.vitelGlobal?.provider,
        vitelId: r.vitelGlobal?.id,
        lmPlayerId: r.lmPlayer?.id,
        lmLicense: r.lmPlayer?.license,
        emails: Array.isArray(r.emails) ? r.emails.map((e: any) => `${e.provider}:${e.email}`).join('; ') : '',
        createdAt: r.createdAt,
      }));
      const itHeaders = Object.keys(itFlat[0]);
      const itRows = itFlat.map((r: any) => itHeaders.map((h) => r[h] ?? ""));
      await writeSheet("IT_Accounts", [itHeaders, ...itRows]);
    }

    // PC Laptops and flattened view
    if (Array.isArray(hr.pcLaptopAssets) && hr.pcLaptopAssets.length > 0) {
      const pcs = hr.pcLaptopAssets;
      const pcHeaders = Object.keys(pcs[0]);
      const pcRows = pcs.map((p: any) => pcHeaders.map((h) => p[h] ?? ""));
      await writeSheet("PC_Laptops", [pcHeaders, ...pcRows]);

      // Flatten with asset details resolved
      const getAssetDetails = (assetId: string) => {
        const asset = sys.find((a: any) => String(a.id) === String(assetId));
        if (!asset) return assetId || "";
        let details = `${asset.id} (${asset.vendorName || ''}`;
        if (asset.ramSize) details += ` - ${asset.ramSize}`;
        if (asset.storageType && asset.storageCapacity) details += ` - ${asset.storageType} ${asset.storageCapacity}`;
        details += ")";
        return details;
      };

      const pcFlattened = pcs.map((p: any) => ({
        id: p.id,
        mouse: getAssetDetails(p.mouseId || ""),
        keyboard: getAssetDetails(p.keyboardId || ""),
        motherboard: getAssetDetails(p.motherboardId || ""),
        camera: getAssetDetails(p.cameraId || ""),
        headphone: getAssetDetails(p.headphoneId || ""),
        powerSupply: getAssetDetails(p.powerSupplyId || ""),
        storage: getAssetDetails(p.storageId || ""),
        ram1: getAssetDetails(p.ramId || ""),
        ram2: getAssetDetails(p.ramId2 || ""),
        createdAt: p.createdAt,
      }));
      const flatHeaders = Object.keys(pcFlattened[0]);
      const flatRows = pcFlattened.map((r: any) => flatHeaders.map((h) => r[h] ?? ""));
      await writeSheet("PC_Laptops_Flat", [flatHeaders, ...flatRows]);
    }

    // Salaries
    if (sal.length > 0) {
      const headers = Object.keys(sal[0]);
      const rows = sal.map((r: any) => headers.map((h) => r?.[h] ?? ""));
      await writeSheet("Salaries", [headers, ...rows]);
    }
  }
}
