import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Settings,
  LogOut,
  User,
  Menu,
  LogIn,
  Users,
  Building2,
  LayoutDashboard,
  Database,
  RefreshCw,
  ServerCog,
  HardDrive,
} from "lucide-react";

export default function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<"unknown" | "online" | "offline">(
    "unknown",
  );

  const syncAll = async () => {
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
    } catch (e) {
      // swallow
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const id = setInterval(syncAll, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // safeFetch: wraps fetch and returns an object similar to Response but never throws
  async function safeFetch(url: string, opts?: RequestInit) {
    try {
      const res = await fetch(url, opts);
      return res;
    } catch (err) {
      // Return a fallback object that mimics the Response interface used below
      return {
        ok: false,
        status: 0,
        json: async () => null,
        text: async () => "",
      } as unknown as Response;
    }
  }

  // Pull data from server periodically when DB is online
  const pullFromServer = async () => {
    if (dbStatus !== "online") return;
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-role": "admin",
      } as const;
      // Fetch assets, it accounts, employees, pc laptops using safeFetch to avoid throwing
      const [assetsR, itR, empR, pcR] = await Promise.all([
        safeFetch("/api/hr/assets", { headers }),
        safeFetch("/api/hr/it-accounts", { headers }),
        safeFetch("/api/hr/employees", { headers }),
        safeFetch("/api/hr/pc-laptops", { headers }),
      ]);

      if (assetsR && (assetsR as any).ok) {
        const j = await (assetsR as Response).json().catch(() => null);
        if (j?.items) {
          const recent = localStorage.getItem("recentlyDeletedAsset");
          if (recent) {
            try {
              const r = JSON.parse(recent);
              const age = Date.now() - (r.ts || 0);
              if (age < 10_000) {
                console.debug(
                  "Skipping systemAssets overwrite due to recent local delete",
                  r.id,
                );
              } else {
                localStorage.setItem("systemAssets", JSON.stringify(j.items));
              }
            } catch {
              localStorage.setItem("systemAssets", JSON.stringify(j.items));
            }
          } else {
            localStorage.setItem("systemAssets", JSON.stringify(j.items));
          }
        }
      }
      if (itR && (itR as any).ok) {
        const j = await (itR as Response).json().catch(() => null);
        if (j?.items) {
          // if a recent local delete happened for an IT account, avoid overwriting immediately
          const recent = localStorage.getItem("recentlyDeletedItAccount");
          if (recent) {
            try {
              const r = JSON.parse(recent);
              const age = Date.now() - (r.ts || 0);
              if (age < 10_000) {
                // skip overwriting itAccounts to avoid immediate re-appearance
                console.debug(
                  "Skipping itAccounts overwrite due to recent local delete",
                  r.id,
                );
              } else {
                localStorage.setItem("itAccounts", JSON.stringify(j.items));
              }
            } catch {
              localStorage.setItem("itAccounts", JSON.stringify(j.items));
            }
          } else {
            localStorage.setItem("itAccounts", JSON.stringify(j.items));
          }
        }
      }
      if (empR && (empR as any).ok) {
        const j = await (empR as Response).json().catch(() => null);
        if (j?.items) {
          const recent = localStorage.getItem("recentlyDeletedEmployee");
          if (recent) {
            try {
              const r = JSON.parse(recent);
              const age = Date.now() - (r.ts || 0);
              if (age < 10_000) {
                console.debug(
                  "Skipping hrEmployees overwrite due to recent local delete",
                  r.id,
                );
              } else {
                localStorage.setItem("hrEmployees", JSON.stringify(j.items));
              }
            } catch {
              localStorage.setItem("hrEmployees", JSON.stringify(j.items));
            }
          } else {
            localStorage.setItem("hrEmployees", JSON.stringify(j.items));
          }
        }
      }
      if (pcR && (pcR as any).ok) {
        const j = await (pcR as Response).json().catch(() => null);
        if (j?.items) {
          const recent = localStorage.getItem("recentlyDeletedPcAsset");
          if (recent) {
            try {
              const r = JSON.parse(recent);
              const age = Date.now() - (r.ts || 0);
              if (age < 10_000) {
                console.debug(
                  "Skipping pcLaptopAssets overwrite due to recent local delete",
                  r.id,
                );
              } else {
                localStorage.setItem("pcLaptopAssets", JSON.stringify(j.items));
              }
            } catch {
              localStorage.setItem("pcLaptopAssets", JSON.stringify(j.items));
            }
          } else {
            localStorage.setItem("pcLaptopAssets", JSON.stringify(j.items));
          }
        }
      }
      setLastSync(new Date().toLocaleTimeString());
    } catch (e) {
      console.debug("Pull from server failed", e);
    }
  };

  useEffect(() => {
    // pull immediately when DB becomes online
    if (dbStatus === "online") pullFromServer();
    const id = setInterval(pullFromServer, 60 * 1000);
    return () => clearInterval(id);
  }, [dbStatus]);

  // DB health check
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const url = `${window.location.origin}/api/db/health`;
      try {
        const r = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          if (!cancelled) setDbStatus("offline");
          console.debug("DB health check non-ok", r.status, text);
          return;
        }
        const j = await r.json().catch(() => null);
        if (!cancelled) setDbStatus(j?.connected ? "online" : "offline");
      } catch (err: any) {
        clearTimeout(timeout);
        // Silence AbortError - it's expected when request times out
        if (err && err.name === "AbortError") {
          // don't set offline repeatedly for aborts; just debug
          console.debug("DB health check aborted (timeout)");
          return;
        }
        if (!cancelled) setDbStatus("offline");
        console.debug("DB health check failed (caught)", err?.message || err);
      }
    };
    try {
      check();
    } catch (err) {
      console.debug("DB health check sync error", err);
    }
    const id = setInterval(check, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Check authentication status
  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    const role = localStorage.getItem("userRole");
    const user = localStorage.getItem("currentUser");

    setIsAuthenticated(!!auth);
    setUserRole(role || "");
    setCurrentUser(user || "");
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentUser");
    setIsAuthenticated(false);
    setUserRole("");
    setCurrentUser("");
    navigate("/login");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleViewUsers = () => {
    // Navigate to admin dashboard and scroll to users section
    if (location.pathname === "/admin") {
      const usersSection = document.getElementById("users-section");
      if (usersSection) {
        usersSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/admin");
    }
  };

  const handleHRDashboard = () => {
    navigate("/hr");
  };

  const handleMainDashboard = () => {
    navigate("/deshbord");
  };

  const handleSystemInfo = () => {
    navigate("/system-info");
  };

  const handlePcLaptopInfo = () => {
    navigate("/pc-laptop-info");
  };

  const handleMasterAdmin = () => {
    navigate("/master-admin");
  };

  const deployNetlify = async () => {
    try {
      alert(
        "To deploy: use the platform's Netlify MCP. Click 'Connect Netlify MCP' in the top bar and deploy.",
      );
    } catch {}
  };

  const dbBackfill = async () => {
    try {
      const r = await fetch("/api/hr/admin/backfill-asset-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "admin" },
      });
      const j = await r.json();
      alert(
        j?.ok
          ? `Backfill done (mirrored: ${j.mirrored || 0})`
          : `Backfill failed`,
      );
    } catch (e) {
      alert("Backfill failed");
    }
  };

  const dbHealth = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = `${window.location.origin}/api/db/health`;
    fetch(url, { signal: controller.signal })
      .then(async (r) => {
        clearTimeout(timeout);
        if (!r.ok) {
          const txt = await r.text().catch(() => "");
          alert(`Database check failed: HTTP ${r.status} ${txt}`);
          return;
        }
        const j = await r.json().catch(() => null);
        if (j?.connected) alert("Database connected");
        else alert(`Database offline: ${j?.reason || j?.error || "Unknown"}`);
      })
      .catch((e) => {
        clearTimeout(timeout);
        alert(`Database check failed: ${e?.message || "Network error"}`);
      });
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-blue-400 hover:scale-110">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-white">
                {isAuthenticated
                  ? userRole === "admin"
                    ? "Admin Dashboard"
                    : `Welcome, ${currentUser}`
                  : "User Management System"}
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Admin Options */}
                {userRole === "admin" ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMainDashboard}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      IT Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleHRDashboard}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      HR Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMasterAdmin}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Master Admin
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={syncing}
                          title={
                            lastSync ? `Last sync: ${lastSync}` : "Sync to DB"
                          }
                          className={`transition-all duration-300 ${dbStatus === "online" ? "border-green-500 text-green-300 hover:bg-green-700 hover:text-white" : dbStatus === "offline" ? "border-red-500 text-red-300 hover:bg-red-700 hover:text-white" : "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"}`}
                        >
                          <RefreshCw
                            className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
                          />
                          {syncing ? "Syncing" : "Sync"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="bg-slate-800 border-slate-700 text-white"
                        align="start"
                      >
                        <DropdownMenuItem
                          className="focus:bg-slate-700 cursor-pointer"
                          onClick={syncAll}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Run Sync
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="focus:bg-slate-700 cursor-pointer"
                          onClick={() => navigate("/data-sync")}
                        >
                          <HardDrive className="h-4 w-4 mr-2" />
                          Sync Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem
                          className="focus:bg-slate-700 cursor-pointer"
                          onClick={dbHealth}
                        >
                          <ServerCog className="h-4 w-4 mr-2" />
                          DB Health
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/database-setup")}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300"
                      title="Database Setup"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Database
                    </Button>
                  </>
                ) : userRole === "hr" ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleHRDashboard}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      HR Dashboard
                    </Button>
                  </>
                ) : userRole === "it" ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMainDashboard}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      IT Dashboard
                    </Button>
                  </>
                ) : null}

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {currentUser}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="bg-slate-800 border-slate-700 text-white"
                    align="end"
                  >
                    <DropdownMenuItem
                      className="focus:bg-slate-700 cursor-pointer"
                      onClick={handleViewUsers}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Users
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-slate-700 cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-slate-700 cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="focus:bg-red-600 cursor-pointer text-red-400 focus:text-white"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Login Button for non-authenticated users */
              <Button
                onClick={handleLogin}
                className="bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 hover:scale-105"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-slate-900 border-slate-700 text-white">
                <SheetHeader>
                  <SheetTitle className="text-white">
                    {isAuthenticated ? `${currentUser}` : "Menu"}
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {isAuthenticated ? (
                    <>
                      {/* Admin Mobile Options */}
                      {userRole === "admin" ? (
                        <>
                          <Button
                            variant="outline"
                            className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => {
                              handleViewUsers();
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Users
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => {
                              handleMainDashboard();
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            IT Dashboard
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => {
                              handleHRDashboard();
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            HR Dashboard
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => {
                              handleMasterAdmin();
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <Database className="h-4 w-4 mr-2" />
                            Master Admin
                          </Button>

                          <Button
                            variant="outline"
                            className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => {
                              syncAll();
                              setIsMobileMenuOpen(false);
                            }}
                            disabled={syncing}
                            title={
                              lastSync ? `Last sync: ${lastSync}` : "Sync to DB"
                            }
                          >
                            <RefreshCw
                              className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
                            />
                            {syncing ? "Syncing" : "Run Sync"}
                          </Button>

                          <Button
                            variant="outline"
                            className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => {
                              navigate("/data-sync");
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <HardDrive className="h-4 w-4 mr-2" />
                            Sync Status
                          </Button>
                        </>
                      ) : userRole === "hr" ? (
                        <>
                          <Button
                            variant="outline"
                            className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => {
                              handleHRDashboard();
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            HR Dashboard
                          </Button>
                        </>
                      ) : userRole === "it" ? (
                        <>
                          <Button
                            variant="outline"
                            className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => {
                              handleMainDashboard();
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            IT Dashboard
                          </Button>
                        </>
                      ) : null}

                      <Button
                        variant="outline"
                        className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => {
                        handleLogin();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
