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

    const writeSheet = async (name: string, rows: any[][]) => {
      // Clear then write header+rows
      await sheets.spreadsheets.values.clear({
        spreadsheetId: process.env.GOOGLE_SHEET_ID!,
        range: name,
      });
      if (rows.length > 0) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID!,
          range: name,
          valueInputOption: "RAW",
          requestBody: { values: rows },
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
    }

    // Salaries
    if (sal.length > 0) {
      const headers = Object.keys(sal[0]);
      const rows = sal.map((r: any) => headers.map((h) => r?.[h] ?? ""));
      await writeSheet("Salaries", [headers, ...rows]);
    }
  }
}
