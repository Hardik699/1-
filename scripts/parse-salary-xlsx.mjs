import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import xlsx from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath =
  process.argv[2] || path.join(__dirname, "..", "tmp", "we.xlsx");

if (!fs.existsSync(filePath)) {
  console.error("File not found:", filePath);
  process.exit(2);
}

const wb = xlsx.readFile(filePath, {
  cellFormula: true,
  cellNF: true,
  cellDates: true,
});
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];

// Dump sheet range and some key cells
const range = sheet["!ref"] || "unknown";
console.log("Sheet:", sheetName, "Range:", range);

// Collect all cells with formulas or values into an object
const data = {};
for (const RCN in sheet) {
  if (RCN[0] === "!") continue;
  const cell = sheet[RCN];
  data[RCN] = {
    v: cell.v,
    t: cell.t,
    f: cell.f || null,
    w: cell.w || null,
  };
}

// Print first 200 entries
const entries = Object.entries(data).slice(0, 200);
for (const [k, v] of entries) {
  console.log(k, JSON.stringify(v));
}

// Try to find any cell that mentions CTC or Basic or PF
const keywords = ["CTC", "Basic", "PF", "ESIC", "HRA", "Conveyance", "Gross"];
const found = {};
for (const [k, v] of Object.entries(data)) {
  const text = String(v.w || v.v || "").toLowerCase();
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) {
      found[k] = v;
    }
  }
}

console.log("\n--- Found keyword cells ---");
for (const [k, v] of Object.entries(found)) console.log(k, JSON.stringify(v));

console.log("\nOutput JSON (first 100 cells)");
console.log(JSON.stringify(Object.fromEntries(entries), null, 2));
