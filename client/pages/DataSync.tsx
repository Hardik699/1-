import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, HardDrive } from "lucide-react";

const DataSync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const runSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-role": "admin",
      } as const;

      const sysRaw = localStorage.getItem("systemAssets");
      const sys = sysRaw ? JSON.parse(sysRaw) : [];
      if (Array.isArray(sys) && sys.length) {
        await fetch("/api/hr/assets/upsert-batch", {
          method: "POST",
          headers,
          body: JSON.stringify({ items: sys }),
        });
      }

      const itRaw = localStorage.getItem("itAccounts");
      const it = itRaw ? JSON.parse(itRaw) : [];
      if (Array.isArray(it)) {
        for (const rec of it) {
          await fetch("/api/hr/it-accounts", {
            method: "POST",
            headers,
            body: JSON.stringify(rec),
          });
        }
      }

      const empRaw = localStorage.getItem("hrEmployees");
      const emps = empRaw ? JSON.parse(empRaw) : [];
      if (Array.isArray(emps)) {
        for (const e of emps) {
          await fetch("/api/hr/employees", {
            method: "POST",
            headers,
            body: JSON.stringify(e),
          });
        }
      }

      const pcRaw = localStorage.getItem("pcLaptopAssets");
      const pcs = pcRaw ? JSON.parse(pcRaw) : [];
      if (Array.isArray(pcs) && pcs.length) {
        await fetch("/api/hr/pc-laptops/upsert-batch", {
          method: "POST",
          headers,
          body: JSON.stringify({ items: pcs }),
        });
      }

      setLastSync(new Date().toLocaleTimeString());
      alert("Sync completed");
    } catch (e) {
      console.error(e);
      alert("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-white mb-4">Data Sync</h2>
      <p className="text-slate-300 mb-6">
        Run and inspect data synchronization between local storage and server.
      </p>

      <div className="space-y-4">
        <Button
          onClick={runSync}
          disabled={syncing}
          className="inline-flex items-center"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Syncing" : "Run Sync"}
        </Button>

        <Button
          onClick={() => navigator.clipboard.writeText(lastSync || "")}
          disabled={!lastSync}
          className="inline-flex items-center"
        >
          <HardDrive className="h-4 w-4 mr-2" />
          {lastSync ? `Last sync: ${lastSync}` : "No sync yet"}
        </Button>
      </div>
    </div>
  );
};

export default DataSync;
