import AppNav from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { STORAGE_KEY } from "@/lib/systemAssets";
import { useState, useEffect } from "react";
import {
  Mouse,
  Keyboard,
  Cpu,
  HardDrive,
  PlugZap,
  Headphones,
  Camera,
  Monitor,
  Phone,
  ArrowLeft,
} from "lucide-react";

const items = [
  {
    name: "Mouse",
    slug: "mouse",
    Icon: Mouse,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
  },
  {
    name: "Keyboard",
    slug: "keyboard",
    Icon: Keyboard,
    color: "text-green-400",
    bg: "bg-green-500/20",
  },
  {
    name: "Motherboard",
    slug: "motherboard",
    Icon: Cpu,
    color: "text-purple-400",
    bg: "bg-purple-500/20",
  },
  {
    name: "RAM",
    slug: "ram",
    Icon: HardDrive,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
  },
  {
    name: "SSD/HDD",
    slug: "storage",
    Icon: HardDrive,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
  },
  {
    name: "Power Supply",
    slug: "power-supply",
    Icon: PlugZap,
    color: "text-red-400",
    bg: "bg-red-500/20",
  },
  {
    name: "Headphone",
    slug: "headphone",
    Icon: Headphones,
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
  },
  {
    name: "Camera",
    slug: "camera",
    Icon: Camera,
    color: "text-pink-400",
    bg: "bg-pink-500/20",
  },
  {
    name: "Monitor",
    slug: "monitor",
    Icon: Monitor,
    color: "text-teal-400",
    bg: "bg-teal-500/20",
  },
  {
    name: "Vonage",
    slug: "vonage",
    Icon: Phone,
    color: "text-indigo-400",
    bg: "bg-indigo-500/20",
  },
  {
    name: "Vitel Global",
    slug: "vitel-global",
    Icon: Phone,
    color: "text-amber-300",
    bg: "bg-amber-500/20",
  },
];

export default function SystemInfo() {
  const navigate = useNavigate();
  const [assetCount, setAssetCount] = useState(0);

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    const assets = existing ? JSON.parse(existing) : [];
    setAssetCount(assets.length);
  }, []);

  const handleBack = () => {
    const currentPath = window.location.pathname;
    try {
      // Try native history back first
      if (typeof window !== "undefined" && window.history) {
        window.history.back();
        // If history.back didn't change the path within 250ms, navigate to home as fallback
        setTimeout(() => {
          if (window.location.pathname === currentPath) {
            navigate("/");
          }
        }, 250);
        return;
      }
    } catch (e) {
      // ignore
    }
    // Fallback
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-deep-900 via-blue-deep-800 to-slate-900">
      <AppNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">System Info</h1>
            <p className="text-slate-400">Hardware categories</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-slate-700 text-white rounded-lg hover:bg-slate-800/60 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
              {assetCount} assets | {items.length} categories
            </Badge>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(({ name, slug, Icon, color, bg }) => (
            <Card
              key={name}
              className="group relative overflow-hidden bg-slate-900/50 border-slate-700 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-slate-500/60"
            >
              <CardHeader>
                <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-blue-500/5 blur-2xl transition-all duration-300 group-hover:bg-blue-500/15" />
                <CardTitle className="text-white flex items-center justify-between">
                  <span>{name}</span>
                  <span
                    className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <Icon className={`h-5 w-5 ${color}`} />
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-end gap-2">
                <Button
                  onClick={() => navigate(`/system-info/${slug}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-blue-500/20 transition-transform duration-300 hover:scale-105"
                >
                  Go
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
