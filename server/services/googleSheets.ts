import { google } from "googleapis";

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
}
