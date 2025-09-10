import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppNav from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { encryptJSON, decryptToJSON } from "@/lib/secure";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Users,
  Building2,
  HardDrive,
  Monitor,
  CreditCard,
  UserCheck,
  AlertCircle,
  Database,
  RefreshCw,
  ExternalLink,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";

// Type definitions based on the application's data structures
interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
}

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  department: string;
  position: string;
  tableNumber: string;
  salary: string;
  status: "active" | "inactive";
  joiningDate: string;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  manager: string;
  employeeCount: number;
}

interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  reason: string;
}

interface SystemAsset {
  id: string;
  category: string;
  serialNumber: string;
  vendorName: string;
  companyName?: string;
  purchaseDate: string;
  warrantyEndDate: string;
  ramSize?: string;
  ramType?: string;
  processorModel?: string;
  storageType?: string;
  storageCapacity?: string;
  vonageNumber?: string;
  vonageExtCode?: string;
  vonagePassword?: string;
  createdAt: string;
}

interface PCLaptopAsset {
  id: string;
  createdAt: string;
  mouseId?: string;
  keyboardId?: string;
  motherboardId?: string;
  cameraId?: string;
  headphoneId?: string;
  powerSupplyId?: string;
  storageId?: string;
  ramId?: string;
  ramId2?: string;
}

interface ITAccount {
  id: string;
  employeeId: string;
  employeeName: string;
  systemId: string;
  tableNumber: string;
  department: string;
  emails: Array<{
    provider: string;
    email: string;
    password: string;
  }>;
  vitelGlobal: {
    id: string;
    provider: "vitel" | "vonage";
  };
  lmPlayer: {
    id: string;
    password: string;
    license: string;
  };
  createdAt: string;
}

interface SalaryRecord {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  totalWorkingDays: number;
  actualWorkingDays: number;
  basicSalary: number;
  bonus?: number;
  deductions?: number;
  totalSalary: number;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
}

interface PendingITNotification {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  tableNumber: string;
  email: string;
  createdAt: string;
  processed: boolean;
}

interface AttendanceRecord {
  employeeId: string;
  date: string;
  present: boolean;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

interface MasterData {
  adminUsers: AdminUser[];
  userCredentials: Record<string, string>;
  employees: Employee[];
  departments: Department[];
  leaveRequests: LeaveRequest[];
  attendanceRecords: AttendanceRecord[];
  systemAssets: SystemAsset[];
  pcLaptopAssets: PCLaptopAsset[];
  itAccounts: ITAccount[];
  salaryRecords: SalaryRecord[];
  pendingITNotifications: PendingITNotification[];
  authInfo: {
    isAuthenticated: boolean;
    userRole: string;
    currentUser: string;
  };
}

export default function MasterAdmin() {
  const navigate = useNavigate();
  const [masterData, setMasterData] = useState<MasterData>({
    adminUsers: [],
    userCredentials: {},
    employees: [],
    departments: [],
    leaveRequests: [],
    attendanceRecords: [],
    systemAssets: [],
    pcLaptopAssets: [],
    itAccounts: [],
    salaryRecords: [],
    pendingITNotifications: [],
    authInfo: {
      isAuthenticated: false,
      userRole: "",
      currentUser: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const [dbOpen, setDbOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isGoogleSheetsConfigured, setIsGoogleSheetsConfigured] =
    useState(false);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<{
    title?: string;
    url?: string;
  } | null>(null);
  const [hrConfigured, setHrConfigured] = useState(false);
  const [hrInfo, setHrInfo] = useState<{ title?: string; url?: string } | null>(
    null,
  );
  const [dbUnlocked, setDbUnlocked] = useState(false);
  const [dbPassword, setDbPassword] = useState("");
  const [hasSecureBackup, setHasSecureBackup] = useState(false);

  useEffect(() => {
    loadAllData();
    setHasSecureBackup(!!localStorage.getItem("secureDB"));
    // Check Google Sheets status
    fetch("/api/google-sheets/info")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setIsGoogleSheetsConfigured(true);
          setSpreadsheetInfo({ title: d.title, url: d.url });
        }
      })
      .catch(() => setIsGoogleSheetsConfigured(false));

    fetch("/api/google-sheets/info-hr")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setHrConfigured(true);
          setHrInfo({ title: d.title, url: d.url });
        }
      })
      .catch(() => setHrConfigured(false));
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load all localStorage data
      const adminUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const userCredentials = JSON.parse(
        localStorage.getItem("userCredentials") || "{}",
      );
      let employees = JSON.parse(localStorage.getItem("hrEmployees") || "[]");
      const rawDepts = localStorage.getItem("departments") || "[]";
      let departments = JSON.parse(rawDepts);
      try {
        const parsed = Array.isArray(departments) ? departments : [];
        const normalized = (parsed || []).map((d: any, idx: number) => ({
          id:
            d?.id ||
            `${String(d?.name || "dept")
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "-")}-${idx}`,
          name: String(d?.name || "").trim(),
          manager: d?.manager || "",
          employeeCount:
            typeof d?.employeeCount === "number" ? d.employeeCount : 0,
        }));
        const deduped = Array.from(
          new Map(
            normalized.map((d: any) => [
              String(d.name).trim().toLowerCase(),
              d,
            ]),
          ).values(),
        );
        departments = deduped;
      } catch (err) {
        // keep departments as parsed
      }
      const leaveRequests = JSON.parse(
        localStorage.getItem("leaveRequests") || "[]",
      );
      const attendanceRecords = JSON.parse(
        localStorage.getItem("attendanceRecords") || "[]",
      );
      let systemAssets = JSON.parse(
        localStorage.getItem("systemAssets") || "[]",
      );
      let pcLaptopAssets = JSON.parse(
        localStorage.getItem("pcLaptopAssets") || "[]",
      );
      let itAccounts = JSON.parse(localStorage.getItem("itAccounts") || "[]");
      let salaryRecords = JSON.parse(
        localStorage.getItem("salaryRecords") || "[]",
      );
      let pendingITNotifications = JSON.parse(
        localStorage.getItem("pendingITNotifications") || "[]",
      );

      // Load auth info
      const authInfo = {
        isAuthenticated: localStorage.getItem("isAuthenticated") === "true",
        userRole: localStorage.getItem("userRole") || "",
        currentUser: localStorage.getItem("currentUser") || "",
      };

      // Attempt to load server-backed data when available (Neon/Postgres)
      try {
        const headers = {
          "Content-Type": "application/json",
          "x-role": "admin",
        } as const;
        // Fetch assets from server (if DB connected)
        const [assetsResp, itResp, empResp] = await Promise.allSettled([
          fetch("/api/hr/assets", { headers }),
          fetch("/api/hr/it-accounts", { headers }),
          fetch("/api/hr/employees", { headers }),
        ]);

        if (assetsResp.status === "fulfilled" && assetsResp.value.ok) {
          const j = await assetsResp.value.json().catch(() => null);
          if (j?.items && Array.isArray(j.items)) systemAssets = j.items;
        }
        if (itResp.status === "fulfilled" && itResp.value.ok) {
          const j = await itResp.value.json().catch(() => null);
          if (j?.items && Array.isArray(j.items)) itAccounts = j.items;
        }
        if (empResp.status === "fulfilled" && empResp.value.ok) {
          const j = await empResp.value.json().catch(() => null);
          if (Array.isArray(j.items || j)) employees = j.items || j;
        }
      } catch (e) {
        // ignore server fetch errors and fallback to localStorage
      }

      setMasterData({
        adminUsers,
        userCredentials,
        employees,
        departments,
        leaveRequests,
        attendanceRecords,
        systemAssets,
        pcLaptopAssets,
        itAccounts,
        salaryRecords,
        pendingITNotifications,
        authInfo,
      });
    } catch (error) {
      console.error("Error loading master data:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearEmployeesAndITDemo = () => {
    try {
      // Remove HR employees, departments, IT accounts, and pending IT notifications
      [
        "hrEmployees",
        "departments",
        "itAccounts",
        "pendingITNotifications",
      ].forEach((k) => localStorage.removeItem(k));

      // Remove demo assets from systemAssets (demo IDs like WX-*-001/002 or known demo companies)
      const raw = localStorage.getItem("systemAssets");
      if (raw) {
        const assets = JSON.parse(raw || "[]");
        const isDemo = (a: any) => {
          const id = String(a?.id || "");
          const demoId = /^WX\-(M|K|MB|R|PS|H|C|MN|V)\-(001|002)$/.test(id);
          const demoCompany = ["Tech Solutions Inc", "Business Corp"].includes(
            String(a?.companyName || ""),
          );
          return demoId || demoCompany;
        };
        const filtered = assets.filter((a: any) => !isDemo(a));
        if (filtered.length) {
          localStorage.setItem("systemAssets", JSON.stringify(filtered));
        } else {
          localStorage.removeItem("systemAssets");
        }
      }

      // Also clear any generated attendance/leave tied to employees
      ["attendanceRecords", "leaveRequests"].forEach((k) =>
        localStorage.removeItem(k),
      );

      loadAllData();
      alert("Employees and IT demo data cleared");
    } catch (e) {
      alert("Failed to clear data");
    }
  };

  const exportAllData = () => {
    try {
      const keys = [
        "users",
        "userCredentials",
        "hrEmployees",
        "departments",
        "leaveRequests",
        "attendanceRecords",
        "systemAssets",
        "pcLaptopAssets",
        "itAccounts",
        "salaryRecords",
        "pendingITNotifications",
        "isAuthenticated",
        "userRole",
        "currentUser",
      ];
      const payload: Record<string, unknown> = {};
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v !== null) {
          if (k === "isAuthenticated") payload[k] = v === "true";
          else if (k === "userRole" || k === "currentUser") payload[k] = v;
          else {
            try {
              payload[k] = JSON.parse(v);
            } catch {
              payload[k] = v;
            }
          }
        }
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `master-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export data");
    }
  };

  const exportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const sys = masterData.systemAssets || [];
      const pcs = masterData.pcLaptopAssets || [];
      const it = masterData.itAccounts || [];
      const notifs = masterData.pendingITNotifications || [];
      const employees = masterData.employees || [];
      const departments = masterData.departments || [];
      const leaveRequests = masterData.leaveRequests || [];
      const attendance = masterData.attendanceRecords || [];
      const salaryRecords = masterData.salaryRecords || [];

      // Helper: remove keys that are empty across all rows and mask sensitive fields
      const filterEmptyAndMask = (rows: any[]) => {
        if (!Array.isArray(rows) || rows.length === 0) return [];
        const keys = Array.from(
          rows.reduce((s, r) => {
            Object.keys(r || {}).forEach((k) => s.add(k));
            return s;
          }, new Set<string>()),
        );

        const keepKeys = keys.filter((k) => {
          return rows.some((r) => {
            const v = (r as any)?.[String(k)];
            if (v === null || v === undefined) return false;
            if (typeof v === "string") return v.trim() !== "";
            if (Array.isArray(v)) return v.length > 0;
            if (typeof v === "object") return Object.keys(v).length > 0;
            return true;
          });
        });

        // mask sensitive fields
        const sensitivePatterns = [/password/i, /secret/i, /metadata/i];

        return rows.map((r) => {
          const out: any = {};
          for (const k of keepKeys) {
            let val = (r as any)?.[String(k)];
            if (val === undefined) val = "";
            // mask if key matches sensitive patterns
            if (sensitivePatterns.some((p) => p.test(String(k)))) {
              if (
                val === null ||
                val === undefined ||
                String(val).trim() === ""
              )
                out[String(k)] = "";
              else out[String(k)] = "••••••";
              continue;
            }
            // for nested objects/arrays, stringify for Excel readability
            if (Array.isArray(val) || typeof val === "object") {
              try {
                out[String(k)] = JSON.stringify(val);
              } catch (e) {
                out[String(k)] = String(val);
              }
            } else {
              out[String(k)] = val;
            }
          }
          return out;
        });
      };

      // Helper to safely append sheet with limited name length and filtered columns
      const appendSheet = (name: string, data: any[]) => {
        const safeName = name.substring(0, 31);
        const filtered = filterEmptyAndMask(data || []);
        const ws = XLSX.utils.json_to_sheet(filtered);
        XLSX.utils.book_append_sheet(wb, ws, safeName);
      };

      // Core sheets
      appendSheet("Employees", employees);
      appendSheet("Departments", departments);
      appendSheet("LeaveRequests", leaveRequests);
      appendSheet("Attendance", attendance);
      appendSheet("SalaryRecords", salaryRecords);

      // Sanitize system assets (remove raw password/metadata) but filter empty cols
      const sanitizedSys = (sys || []).map((s: any) => {
        const { vonagePassword, vitelPassword, password, metadata, ...rest } =
          s || {};
        return rest;
      });
      appendSheet("System_Assets", sanitizedSys);
      appendSheet("PC_Laptops", pcs);

      const itFlat = it.map((r) => ({
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
        emails: Array.isArray(r.emails)
          ? r.emails.map((e: any) => `${e.provider}:${e.email}`).join("; ")
          : "",
        createdAt: r.createdAt,
      }));
      appendSheet("IT_Accounts", itFlat);
      appendSheet("IT_Notifications", notifs);

      // Append category-specific sheets based on systemAssets categories
      const categories = Array.from(
        new Set(sanitizedSys.map((s: any) => (s.category || "").toString())),
      ).filter(Boolean);

      for (const cat of categories) {
        const rows = sanitizedSys.filter(
          (s: any) => String(s.category) === String(cat),
        );
        // Normalize keys for better Excel readability
        const normalized = rows.map((r: any) => ({
          id: r.id,
          category: r.category,
          vendor: r.vendorName,
          company: r.companyName || "",
          serialNumber: r.serialNumber || r.serial || "",
          purchaseDate: r.purchaseDate,
          warrantyEndDate: r.warrantyEndDate,
          number: r.vonageNumber || r.vitelNumber || r.number || "",
          extCode: r.vonageExtCode || r.vitelExtCode || r.ext_code || "",
          // omit password and metadata from category sheets for privacy
          createdAt: r.createdAt,
        }));
        // Sheet name as Category_<name>
        const sheetName = `Category_${String(cat)}`.substring(0, 31);
        appendSheet(sheetName, normalized);
      }

      // Also include a flattened view of PC/Laptops with resolved asset names
      const pcFlattened = (pcs || []).map((p: any) => ({
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
      appendSheet("PC_Laptops_Flat", pcFlattened);

      const fileName = `master-data-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Error exporting to Excel. Please try again.");
    }
  };

  const getAssetDetails = (assetId: string) => {
    const asset = masterData.systemAssets.find((a) => a.id === assetId);
    if (!asset) return assetId;

    let details = `${assetId} (${asset.vendorName}`;
    if (asset.ramSize) details += ` - ${asset.ramSize}`;
    if (asset.storageType && asset.storageCapacity)
      details += ` - ${asset.storageType} ${asset.storageCapacity}`;
    details += ")";
    return details;
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = masterData.employees.find((e) => e.id === employeeId);
    return employee ? employee.fullName : employeeId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-deep-900 via-blue-deep-800 to-slate-900">
        <AppNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-xl">Loading master data...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-deep-900 via-blue-deep-800 to-slate-900">
      <AppNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Master Admin Dashboard
            </h1>
            <p className="text-slate-400">
              Complete database overview in table format
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={exportExcel}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
            {isGoogleSheetsConfigured && (
              <>
                <Button
                  onClick={async () => {
                    try {
                      setSyncing(true);
                      const resp = await fetch(
                        "/api/google-sheets/sync-master-data",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ masterData }),
                        },
                      );
                      const data = await resp.json();
                      if (!data?.success) alert(data?.error || "Sync failed");
                      else alert("Synced to Google Sheets");
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  disabled={syncing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                  />
                  {syncing ? "Syncing..." : "Sync to Google Sheets"}
                </Button>
                {spreadsheetInfo?.url && (
                  <Button
                    onClick={() => window.open(spreadsheetInfo.url!, "_blank")}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" /> Open Sheet
                  </Button>
                )}
              </>
            )}
            <Button
              onClick={clearEmployeesAndITDemo}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Employees & IT Demo
            </Button>
          </div>
        </header>

        <Dialog
          open={dbOpen}
          onOpenChange={(o) => {
            setDbOpen(o);
            if (!o) {
              setDbUnlocked(false);
              setDbPassword("");
            }
          }}
        >
          <DialogContent className="bg-slate-900/95 border-slate-700 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle>Master Data Database</DialogTitle>
              <DialogDescription className="text-slate-400">
                Data is stored in your browser (no external database). Enter
                password to view.
              </DialogDescription>
            </DialogHeader>

            {dbUnlocked ? (
              <div className="space-y-4">
                {hasSecureBackup ? (
                  <div className="text-xs text-slate-400">
                    Encrypted backup detected.
                  </div>
                ) : null}
                <div className="max-h-[50vh] overflow-auto rounded-md border border-slate-700 p-3 bg-slate-950">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(masterData, null, 2)}
                  </pre>
                </div>
                <DialogFooter className="flex gap-2">
                  <Button
                    onClick={exportAllData}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Download JSON
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const payload: Record<string, unknown> = {};
                        // Collect known keys
                        const keys = [
                          "users",
                          "userCredentials",
                          "hrEmployees",
                          "departments",
                          "leaveRequests",
                          "attendanceRecords",
                          "systemAssets",
                          "pcLaptopAssets",
                          "itAccounts",
                          "salaryRecords",
                          "pendingITNotifications",
                        ];
                        for (const k of keys) {
                          const v = localStorage.getItem(k);
                          if (v) payload[k] = JSON.parse(v);
                        }
                        const encrypted = await encryptJSON(payload, "1111");
                        localStorage.setItem("secureDB", encrypted);
                        // Remove raw keys
                        for (const k of keys) localStorage.removeItem(k);
                        setHasSecureBackup(true);
                        alert(
                          "Storage locked with encryption. Keep your password safe.",
                        );
                      } catch (e) {
                        alert("Failed to lock storage");
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Lock Storage
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const encrypted = localStorage.getItem("secureDB");
                        if (!encrypted) {
                          alert("No encrypted backup found");
                          return;
                        }
                        const data = await decryptToJSON<
                          Record<string, unknown>
                        >(encrypted, "1111");
                        Object.entries(data || {}).forEach(([k, v]) => {
                          localStorage.setItem(k, JSON.stringify(v));
                        });
                        alert("Storage restored from encrypted backup");
                      } catch (e) {
                        alert("Failed to unlock storage");
                      }
                    }}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    Restore Storage
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                    onClick={() => setDbOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (dbPassword === "1111") {
                    setDbUnlocked(true);
                  } else {
                    alert("Incorrect password");
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm">
                    Enter password
                  </label>
                  <Input
                    type="password"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Password"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Unlock
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                    onClick={() => setDbOpen(false)}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">System Assets</p>
                  <p className="text-2xl font-bold text-white">
                    {masterData.systemAssets.length}
                  </p>
                </div>
                <HardDrive className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">PC/Laptops</p>
                  <p className="text-2xl font-bold text-white">
                    {masterData.pcLaptopAssets.length}
                  </p>
                </div>
                <Monitor className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">IT Accounts</p>
                  <p className="text-2xl font-bold text-white">
                    {masterData.itAccounts.length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">IT Notifications</p>
                  <p className="text-2xl font-bold text-white">
                    {masterData.pendingITNotifications.length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Data Tables */}
        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">IT Data Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="itaccounts" className="w-full">
              <TabsList className="w-full flex flex-wrap gap-2 overflow-x-auto bg-slate-800/70 mb-6 p-1 rounded-lg">
                <TabsTrigger
                  value="pclaptops"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  PC/Laptops
                </TabsTrigger>
                <TabsTrigger
                  value="itaccounts"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  IT Accounts
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  IT Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="mouse"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  Mouse
                </TabsTrigger>
                <TabsTrigger
                  value="keyboard"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  Keyboard
                </TabsTrigger>
                <TabsTrigger
                  value="motherboard"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  Motherboard
                </TabsTrigger>
                <TabsTrigger
                  value="ram"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-indigo-500 data-[state=state=active]:text-white rounded-md px-3 py-1"
                >
                  RAM
                </TabsTrigger>
                <TabsTrigger
                  value="storage"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  Storage
                </TabsTrigger>
                <TabsTrigger
                  value="power-supply"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  Power Supply
                </TabsTrigger>
                <TabsTrigger
                  value="headphone"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  Headphone
                </TabsTrigger>
                <TabsTrigger
                  value="camera"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  Camera
                </TabsTrigger>
                <TabsTrigger
                  value="monitor"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  Monitor
                </TabsTrigger>
                <TabsTrigger
                  value="vonage"
                  className="text-xs whitespace-nowrap data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-md px-3 py-1"
                >
                  Vonage
                </TabsTrigger>
              </TabsList>

              {/* Employees Table */}
              <TabsContent value="employees">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Table No.</TableHead>
                        <TableHead>Salary</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joining Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-mono">
                            {employee.employeeId}
                          </TableCell>
                          <TableCell className="font-medium">
                            {employee.fullName}
                          </TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>{employee.tableNumber}</TableCell>
                          <TableCell>₹{employee.salary}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                employee.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              employee.joiningDate,
                            ).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {masterData.employees.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      No employees found
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Admin Users Table */}
              <TabsContent value="admin">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Has Password</TableHead>
                        <TableHead>Created Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono">{user.id}</TableCell>
                          <TableCell className="font-medium">
                            {user.username}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                masterData.userCredentials[user.username]
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {masterData.userCredentials[user.username]
                                ? "Yes"
                                : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {masterData.adminUsers.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      No admin users found
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Departments Table */}
              <TabsContent value="departments">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Department Name</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Employee Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.departments.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-mono">{dept.id}</TableCell>
                          <TableCell className="font-medium">
                            {dept.name}
                          </TableCell>
                          <TableCell>{dept.manager}</TableCell>
                          <TableCell>{dept.employeeCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {masterData.departments.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      No departments found
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* System Assets Table with category filters */}
              <TabsContent value="systemassets">
                <div className="space-y-4">
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="hidden">
                      <TabsTrigger value="all" className="text-xs">
                        All
                      </TabsTrigger>
                      <TabsTrigger value="mouse" className="text-xs">
                        Mouse
                      </TabsTrigger>
                      <TabsTrigger value="keyboard" className="text-xs">
                        Keyboard
                      </TabsTrigger>
                      <TabsTrigger value="motherboard" className="text-xs">
                        Motherboard
                      </TabsTrigger>
                      <TabsTrigger value="ram" className="text-xs">
                        RAM
                      </TabsTrigger>
                      <TabsTrigger value="storage" className="text-xs">
                        Storage
                      </TabsTrigger>
                      <TabsTrigger value="power-supply" className="text-xs">
                        Power Supply
                      </TabsTrigger>
                      <TabsTrigger value="headphone" className="text-xs">
                        Headphone
                      </TabsTrigger>
                      <TabsTrigger value="camera" className="text-xs">
                        Camera
                      </TabsTrigger>
                      <TabsTrigger value="monitor" className="text-xs">
                        Monitor
                      </TabsTrigger>
                      <TabsTrigger value="vonage" className="text-xs">
                        Vonage
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                      <div className="rounded-md border border-slate-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Asset ID</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Serial Number</TableHead>
                              <TableHead>Purchase Date</TableHead>
                              <TableHead>Warranty End</TableHead>
                              <TableHead>Specifications</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {masterData.systemAssets.map((asset) => (
                              <TableRow key={asset.id}>
                                <TableCell className="font-mono">
                                  {asset.id}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {asset.category}
                                  </Badge>
                                </TableCell>
                                <TableCell>{asset.vendorName}</TableCell>
                                <TableCell className="font-mono">
                                  {asset.serialNumber}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    asset.purchaseDate,
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    asset.warrantyEndDate,
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {asset.ramSize &&
                                    `${asset.ramSize} ${asset.ramType || ""}`}
                                  {asset.processorModel && asset.processorModel}
                                  {asset.storageType &&
                                    `${asset.storageType} ${asset.storageCapacity || ""}`}
                                  {asset.vonageNumber &&
                                    `Tel: ${asset.vonageNumber}`}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {masterData.systemAssets.length === 0 && (
                          <div className="p-8 text-center text-slate-400">
                            No system assets found
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Mouse */}
                    <TabsContent value="mouse">
                      <div className="rounded-md border border-slate-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Serial</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Purchase</TableHead>
                              <TableHead>Warranty End</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {masterData.systemAssets
                              .filter((a) => a.category === "mouse")
                              .map((a) => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-mono">
                                    {a.id}
                                  </TableCell>
                                  <TableCell>{a.companyName}</TableCell>
                                  <TableCell className="font-mono">
                                    {a.serialNumber}
                                  </TableCell>
                                  <TableCell>{a.vendorName}</TableCell>
                                  <TableCell>{a.purchaseDate}</TableCell>
                                  <TableCell>{a.warrantyEndDate}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Keyboard */}
                    <TabsContent value="keyboard">
                      <div className="rounded-md border border-slate-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Serial</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Purchase</TableHead>
                              <TableHead>Warranty End</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {masterData.systemAssets
                              .filter((a) => a.category === "keyboard")
                              .map((a) => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-mono">
                                    {a.id}
                                  </TableCell>
                                  <TableCell>{a.companyName}</TableCell>
                                  <TableCell className="font-mono">
                                    {a.serialNumber}
                                  </TableCell>
                                  <TableCell>{a.vendorName}</TableCell>
                                  <TableCell>{a.purchaseDate}</TableCell>
                                  <TableCell>{a.warrantyEndDate}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Motherboard */}
                    <TabsContent value="motherboard">
                      <div className="rounded-md border border-slate-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Serial</TableHead>
                              <TableHead>Processor</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Purchase</TableHead>
                              <TableHead>Warranty End</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {masterData.systemAssets
                              .filter((a) => a.category === "motherboard")
                              .map((a) => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-mono">
                                    {a.id}
                                  </TableCell>
                                  <TableCell>{a.companyName}</TableCell>
                                  <TableCell className="font-mono">
                                    {a.serialNumber}
                                  </TableCell>
                                  <TableCell>
                                    {a.processorModel || "-"}
                                  </TableCell>
                                  <TableCell>{a.vendorName}</TableCell>
                                  <TableCell>{a.purchaseDate}</TableCell>
                                  <TableCell>{a.warrantyEndDate}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* RAM */}
                    <TabsContent value="ram">
                      <div className="rounded-md border border-slate-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Serial</TableHead>
                              <TableHead>RAM Size</TableHead>
                              <TableHead>RAM Type</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Purchase</TableHead>
                              <TableHead>Warranty End</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {masterData.systemAssets
                              .filter((a) => a.category === "ram")
                              .map((a) => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-mono">
                                    {a.id}
                                  </TableCell>
                                  <TableCell>{a.companyName}</TableCell>
                                  <TableCell className="font-mono">
                                    {a.serialNumber}
                                  </TableCell>
                                  <TableCell>{a.ramSize || "-"}</TableCell>
                                  <TableCell>{a.ramType || "-"}</TableCell>
                                  <TableCell>{a.vendorName}</TableCell>
                                  <TableCell>{a.purchaseDate}</TableCell>
                                  <TableCell>{a.warrantyEndDate}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Storage */}
                    <TabsContent value="storage">
                      <div className="rounded-md border border-slate-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Serial</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Capacity</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Purchase</TableHead>
                              <TableHead>Warranty End</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {masterData.systemAssets
                              .filter((a) => a.category === "storage")
                              .map((a) => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-mono">
                                    {a.id}
                                  </TableCell>
                                  <TableCell>{a.companyName}</TableCell>
                                  <TableCell className="font-mono">
                                    {a.serialNumber}
                                  </TableCell>
                                  <TableCell>{a.storageType || "-"}</TableCell>
                                  <TableCell>
                                    {a.storageCapacity || "-"}
                                  </TableCell>
                                  <TableCell>{a.vendorName}</TableCell>
                                  <TableCell>{a.purchaseDate}</TableCell>
                                  <TableCell>{a.warrantyEndDate}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Power Supply */}
                    <TabsContent value="power-supply">
                      <div className="rounded-md border border-slate-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Serial</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Purchase</TableHead>
                              <TableHead>Warranty End</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {masterData.systemAssets
                              .filter((a) => a.category === "power-supply")
                              .map((a) => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-mono">
                                    {a.id}
                                  </TableCell>
                                  <TableCell>{a.companyName}</TableCell>
                                  <TableCell className="font-mono">
                                    {a.serialNumber}
                                  </TableCell>
                                  <TableCell>{a.vendorName}</TableCell>
                                  <TableCell>{a.purchaseDate}</TableCell>
                                  <TableCell>{a.warrantyEndDate}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Headphone */}
                    <TabsContent value="headphone">
                      <div className="rounded-md border border-slate-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Serial</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Purchase</TableHead>
                              <TableHead>Warranty End</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {masterData.systemAssets
                              .filter((a) => a.category === "headphone")
                              .map((a) => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-mono">
                                    {a.id}
                                  </TableCell>
                                  <TableCell>{a.companyName}</TableCell>
                                  <TableCell className="font-mono">
                                    {a.serialNumber}
                                  </TableCell>
                                  <TableCell>{a.vendorName}</TableCell>
                                  <TableCell>{a.purchaseDate}</TableCell>
                                  <TableCell>{a.warrantyEndDate}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Camera */}
                    <TabsContent value="camera">
                      <div className="rounded-md border border-slate-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Serial</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Purchase</TableHead>
                              <TableHead>Warranty End</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {masterData.systemAssets
                              .filter((a) => a.category === "camera")
                              .map((a) => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-mono">
                                    {a.id}
                                  </TableCell>
                                  <TableCell>{a.companyName}</TableCell>
                                  <TableCell className="font-mono">
                                    {a.serialNumber}
                                  </TableCell>
                                  <TableCell>{a.vendorName}</TableCell>
                                  <TableCell>{a.purchaseDate}</TableCell>
                                  <TableCell>{a.warrantyEndDate}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Monitor */}
                    <TabsContent value="monitor">
                      <div className="rounded-md border border-slate-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Serial</TableHead>
                              <TableHead>Vendor</TableHead>
                              <TableHead>Purchase</TableHead>
                              <TableHead>Warranty End</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {masterData.systemAssets
                              .filter((a) => a.category === "monitor")
                              .map((a) => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-mono">
                                    {a.id}
                                  </TableCell>
                                  <TableCell>{a.companyName}</TableCell>
                                  <TableCell className="font-mono">
                                    {a.serialNumber}
                                  </TableCell>
                                  <TableCell>{a.vendorName}</TableCell>
                                  <TableCell>{a.purchaseDate}</TableCell>
                                  <TableCell>{a.warrantyEndDate}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Vonage */}
                    <TabsContent value="vonage">
                      <div className="rounded-md border border-slate-700">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Number</TableHead>
                              <TableHead>Ext Code</TableHead>
                              <TableHead>Password</TableHead>
                              <TableHead>Purchase</TableHead>
                              <TableHead>Warranty End</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {masterData.systemAssets
                              .filter((a) => a.category === "vonage")
                              .map((a) => (
                                <TableRow key={a.id}>
                                  <TableCell className="font-mono">
                                    {a.id}
                                  </TableCell>
                                  <TableCell>{a.companyName}</TableCell>
                                  <TableCell>{a.vonageNumber}</TableCell>
                                  <TableCell>{a.vonageExtCode}</TableCell>
                                  <TableCell>{a.vonagePassword}</TableCell>
                                  <TableCell>{a.purchaseDate}</TableCell>
                                  <TableCell>{a.warrantyEndDate}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              {/* Mouse */}
              <TabsContent value="mouse">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Purchase</TableHead>
                        <TableHead>Warranty End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.systemAssets
                        .filter((a) => a.category === "mouse")
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono">{a.id}</TableCell>
                            <TableCell>{a.companyName}</TableCell>
                            <TableCell className="font-mono">
                              {a.serialNumber}
                            </TableCell>
                            <TableCell>{a.vendorName}</TableCell>
                            <TableCell>
                              {new Date(a.purchaseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(a.warrantyEndDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Keyboard */}
              <TabsContent value="keyboard">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Purchase</TableHead>
                        <TableHead>Warranty End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.systemAssets
                        .filter((a) => a.category === "keyboard")
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono">{a.id}</TableCell>
                            <TableCell>{a.companyName}</TableCell>
                            <TableCell className="font-mono">
                              {a.serialNumber}
                            </TableCell>
                            <TableCell>{a.vendorName}</TableCell>
                            <TableCell>
                              {new Date(a.purchaseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(a.warrantyEndDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Motherboard */}
              <TabsContent value="motherboard">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Processor</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Purchase</TableHead>
                        <TableHead>Warranty End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.systemAssets
                        .filter((a) => a.category === "motherboard")
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono">{a.id}</TableCell>
                            <TableCell>{a.companyName}</TableCell>
                            <TableCell className="font-mono">
                              {a.serialNumber}
                            </TableCell>
                            <TableCell>{a.processorModel || "-"}</TableCell>
                            <TableCell>{a.vendorName}</TableCell>
                            <TableCell>
                              {new Date(a.purchaseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(a.warrantyEndDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* RAM */}
              <TabsContent value="ram">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>RAM Size</TableHead>
                        <TableHead>RAM Type</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Purchase</TableHead>
                        <TableHead>Warranty End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.systemAssets
                        .filter((a) => a.category === "ram")
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono">{a.id}</TableCell>
                            <TableCell>{a.companyName}</TableCell>
                            <TableCell className="font-mono">
                              {a.serialNumber}
                            </TableCell>
                            <TableCell>{a.ramSize || "-"}</TableCell>
                            <TableCell>{a.ramType || "-"}</TableCell>
                            <TableCell>{a.vendorName}</TableCell>
                            <TableCell>
                              {new Date(a.purchaseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(a.warrantyEndDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Storage */}
              <TabsContent value="storage">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Purchase</TableHead>
                        <TableHead>Warranty End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.systemAssets
                        .filter((a) => a.category === "storage")
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono">{a.id}</TableCell>
                            <TableCell>{a.companyName}</TableCell>
                            <TableCell className="font-mono">
                              {a.serialNumber}
                            </TableCell>
                            <TableCell>{a.storageType || "-"}</TableCell>
                            <TableCell>{a.storageCapacity || "-"}</TableCell>
                            <TableCell>{a.vendorName}</TableCell>
                            <TableCell>
                              {new Date(a.purchaseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(a.warrantyEndDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Power Supply */}
              <TabsContent value="power-supply">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Purchase</TableHead>
                        <TableHead>Warranty End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.systemAssets
                        .filter((a) => a.category === "power-supply")
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono">{a.id}</TableCell>
                            <TableCell>{a.companyName}</TableCell>
                            <TableCell className="font-mono">
                              {a.serialNumber}
                            </TableCell>
                            <TableCell>{a.vendorName}</TableCell>
                            <TableCell>
                              {new Date(a.purchaseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(a.warrantyEndDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Headphone */}
              <TabsContent value="headphone">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Purchase</TableHead>
                        <TableHead>Warranty End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.systemAssets
                        .filter((a) => a.category === "headphone")
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono">{a.id}</TableCell>
                            <TableCell>{a.companyName}</TableCell>
                            <TableCell className="font-mono">
                              {a.serialNumber}
                            </TableCell>
                            <TableCell>{a.vendorName}</TableCell>
                            <TableCell>
                              {new Date(a.purchaseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(a.warrantyEndDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Camera */}
              <TabsContent value="camera">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Purchase</TableHead>
                        <TableHead>Warranty End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.systemAssets
                        .filter((a) => a.category === "camera")
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono">{a.id}</TableCell>
                            <TableCell>{a.companyName}</TableCell>
                            <TableCell className="font-mono">
                              {a.serialNumber}
                            </TableCell>
                            <TableCell>{a.vendorName}</TableCell>
                            <TableCell>
                              {new Date(a.purchaseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(a.warrantyEndDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Monitor */}
              <TabsContent value="monitor">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Purchase</TableHead>
                        <TableHead>Warranty End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.systemAssets
                        .filter((a) => a.category === "monitor")
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono">{a.id}</TableCell>
                            <TableCell>{a.companyName}</TableCell>
                            <TableCell className="font-mono">
                              {a.serialNumber}
                            </TableCell>
                            <TableCell>{a.vendorName}</TableCell>
                            <TableCell>
                              {new Date(a.purchaseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(a.warrantyEndDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Vonage */}
              <TabsContent value="vonage">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Ext Code</TableHead>
                        <TableHead>Password</TableHead>
                        <TableHead>Purchase</TableHead>
                        <TableHead>Warranty End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.systemAssets
                        .filter((a) => a.category === "vonage")
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono">{a.id}</TableCell>
                            <TableCell>{a.companyName}</TableCell>
                            <TableCell>{a.vonageNumber}</TableCell>
                            <TableCell>{a.vonageExtCode}</TableCell>
                            <TableCell>{a.vonagePassword}</TableCell>
                            <TableCell>
                              {new Date(a.purchaseDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(a.warrantyEndDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* PC/Laptop Configurations Table */}
              <TabsContent value="pclaptops">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PC/Laptop ID</TableHead>
                        <TableHead>Mouse</TableHead>
                        <TableHead>Keyboard</TableHead>
                        <TableHead>Motherboard</TableHead>
                        <TableHead>RAM Slot 1</TableHead>
                        <TableHead>RAM Slot 2</TableHead>
                        <TableHead>Storage</TableHead>
                        <TableHead>Created Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.pcLaptopAssets.map((pc) => (
                        <TableRow key={pc.id}>
                          <TableCell className="font-mono font-medium">
                            {pc.id}
                          </TableCell>
                          <TableCell className="text-xs">
                            {pc.mouseId ? getAssetDetails(pc.mouseId) : "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {pc.keyboardId
                              ? getAssetDetails(pc.keyboardId)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {pc.motherboardId
                              ? getAssetDetails(pc.motherboardId)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {pc.ramId ? getAssetDetails(pc.ramId) : "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {pc.ramId2 ? getAssetDetails(pc.ramId2) : "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {pc.storageId ? getAssetDetails(pc.storageId) : "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(pc.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {masterData.pcLaptopAssets.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      No PC/Laptop configurations found
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* IT Accounts Table */}
              <TabsContent value="itaccounts">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>System ID</TableHead>
                        <TableHead>Table No.</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Email Accounts</TableHead>
                        <TableHead>Vitel/Vonage</TableHead>
                        <TableHead>LM Player</TableHead>
                        <TableHead>Created Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.itAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">
                            {account.employeeName}
                          </TableCell>
                          <TableCell className="font-mono">
                            {account.systemId}
                          </TableCell>
                          <TableCell>{account.tableNumber}</TableCell>
                          <TableCell>{account.department}</TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {account.emails.map((email, idx) => (
                                <div key={idx}>
                                  {email.provider}: {email.email}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {account.vitelGlobal.provider}:{" "}
                            {account.vitelGlobal.id}
                          </TableCell>
                          <TableCell className="text-xs">
                            ID: {account.lmPlayer.id}
                            <br />
                            License: {account.lmPlayer.license}
                          </TableCell>
                          <TableCell>
                            {new Date(account.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {masterData.itAccounts.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      No IT accounts found
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Salary Records Table */}
              <TabsContent value="salaries">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Month/Year</TableHead>
                        <TableHead>Working Days</TableHead>
                        <TableHead>Basic Salary</TableHead>
                        <TableHead>Bonus</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Total Salary</TableHead>
                        <TableHead>Payment Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.salaryRecords.map((salary) => (
                        <TableRow key={salary.id}>
                          <TableCell className="font-medium">
                            {getEmployeeName(salary.employeeId)}
                          </TableCell>
                          <TableCell>
                            {salary.month} {salary.year}
                          </TableCell>
                          <TableCell>
                            {salary.actualWorkingDays}/{salary.totalWorkingDays}
                          </TableCell>
                          <TableCell>
                            ₹{salary.basicSalary.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            ₹{salary.bonus?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell>
                            ₹{salary.deductions?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{salary.totalSalary.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {salary.paymentDate
                              ? new Date(
                                  salary.paymentDate,
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {masterData.salaryRecords.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      No salary records found
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Leave Requests Table */}
              <TabsContent value="leaves">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.leaveRequests.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">
                            {leave.employeeName}
                          </TableCell>
                          <TableCell>{leave.leaveType}</TableCell>
                          <TableCell>
                            {new Date(leave.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(leave.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                leave.status === "approved"
                                  ? "default"
                                  : leave.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {leave.reason}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {masterData.leaveRequests.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      No leave requests found
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Pending IT Notifications Table */}
              <TabsContent value="notifications">
                <div className="rounded-md border border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Table No.</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterData.pendingITNotifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell className="font-medium">
                            {notification.employeeName}
                          </TableCell>
                          <TableCell>{notification.department}</TableCell>
                          <TableCell>{notification.tableNumber}</TableCell>
                          <TableCell>{notification.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                notification.processed
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {notification.processed ? "Processed" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              notification.createdAt,
                            ).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {masterData.pendingITNotifications.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                      No pending IT notifications found
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Authentication Info */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Current Session Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Authentication Status:</span>
                <div className="font-medium">
                  <Badge
                    variant={
                      masterData.authInfo.isAuthenticated
                        ? "default"
                        : "destructive"
                    }
                  >
                    {masterData.authInfo.isAuthenticated
                      ? "Authenticated"
                      : "Not Authenticated"}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-slate-400">User Role:</span>
                <div className="font-medium text-white">
                  {masterData.authInfo.userRole || "None"}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Current User:</span>
                <div className="font-medium text-white">
                  {masterData.authInfo.currentUser || "None"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
