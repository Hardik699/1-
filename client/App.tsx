import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import HRDashboard from "./pages/HRDashboard";
import NotFound from "./pages/NotFound";
import Salary from "./pages/Salary";
import Dashboard from "./pages/Dashboard";
import ITDashboard from "./pages/ITDashboard";
import SystemInfo from "./pages/SystemInfo";
import SystemInfoDetail from "./pages/SystemInfoDetail";
import PCLaptopInfo from "./pages/PCLaptopInfo";
import DemoDataView from "./pages/DemoDataView";
import MasterAdmin from "./pages/MasterAdmin";
import GadgetsManagement from "./pages/GadgetsManagement";
import DeployPage from "./pages/Deploy";
import DatabaseSetup from "./pages/DatabaseSetup";
import DataSync from "./pages/DataSync";

import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    try {
      const credentials = JSON.parse(
        localStorage.getItem("userCredentials") || "{}",
      );
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const roles = JSON.parse(localStorage.getItem("userRoles") || "{}");
      let changed = false;
      if (!credentials["hr"]) {
        credentials["hr"] = "Hr@wx2025";
        changed = true;
      }
      if (!users.find((u: any) => u.username === "hr")) {
        users.push({
          id: Date.now().toString(),
          username: "hr",
          createdAt: new Date().toISOString(),
        });
        changed = true;
      }
      if (!roles["hr"]) {
        roles["hr"] = "hr";
        changed = true;
      }

      // Seed IT user
      if (!credentials["it"]) {
        credentials["it"] = "It@wx2025";
        changed = true;
      }
      if (!users.find((u: any) => u.username === "it")) {
        users.push({
          id: (Date.now() + 1).toString(),
          username: "it",
          createdAt: new Date().toISOString(),
        });
        changed = true;
      }
      if (!roles["it"]) {
        roles["it"] = "it";
        changed = true;
      }
      if (changed) {
        localStorage.setItem("userCredentials", JSON.stringify(credentials));
        localStorage.setItem("users", JSON.stringify(users));
        localStorage.setItem("userRoles", JSON.stringify(roles));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/hr" element={<HRDashboard />} />
            <Route path="/salary" element={<Salary />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/deshbord" element={<Dashboard />} />
            <Route path="/it-dashboard" element={<ITDashboard />} />
            <Route path="/it-deshbord" element={<ITDashboard />} />
            <Route path="/system-info" element={<SystemInfo />} />
            <Route path="/system-info/:slug" element={<SystemInfoDetail />} />
            <Route path="/pc-laptop-info" element={<PCLaptopInfo />} />
            <Route path="/demo-data" element={<DemoDataView />} />
            <Route path="/master-admin" element={<MasterAdmin />} />
            <Route path="/gadgets-management" element={<GadgetsManagement />} />
            <Route path="/deploy" element={<DeployPage />} />
            <Route path="/database-setup" element={<DatabaseSetup />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/data-sync" element={<DataSync />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Install safe global fetch wrapper to catch network errors (prevents uncaught TypeError: Failed to fetch)
if (typeof window !== "undefined") {
  try {
    const _w: any = window;
    if (!_w.__originalFetch) {
      _w.__originalFetch = _w.fetch;
      _w.fetch = async (...args: any[]) => {
        try {
          return await _w.__originalFetch(...args);
        } catch (err) {
          // Log for debugging but return a fake Response so callers don't throw
          console.debug("Safe fetch intercepted error:", err?.message || err);
          try {
            return new Response(null, {
              status: 0,
              statusText: "Network Error",
            });
          } catch (e) {
            // fallback object mimicking Response
            return {
              ok: false,
              status: 0,
              statusText: "Network Error",
              json: async () => null,
              text: async () => "",
            } as unknown as Response;
          }
        }
      };
    }
  } catch (e) {
    // ignore
  }
}

createRoot(document.getElementById("root")!).render(<App />);
