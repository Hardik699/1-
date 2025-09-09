import { useState, useEffect } from "react";
import AppNav from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Copy,
  ExternalLink,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DatabaseSetup() {
  const [dbUrl, setDbUrl] = useState("postgresql://neondb_owner:npg_Qhjkl24tnxRE@ep-patient-dew-aeh2x2hr-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [dbStatus, setDbStatus] = useState<"unknown" | "online" | "offline">("unknown");

  // Check current database status
  const checkDbHealth = async () => {
    try {
      const response = await fetch("/api/db/health");
      const data = await response.json();
      setDbStatus(data.connected ? "online" : "offline");
    } catch {
      setDbStatus("offline");
    }
  };

  useEffect(() => {
    checkDbHealth();
    // Auto-test the connection on load
    if (dbUrl) {
      testConnection();
    }
    const interval = setInterval(checkDbHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const testConnection = async () => {
    if (!dbUrl.trim()) {
      setTestResult({
        success: false,
        message: "Please enter your Neon database URL"
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/config/test-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: dbUrl })
      });

      const data = await response.json();
      
      if (response.ok && data.connected) {
        setTestResult({
          success: true,
          message: "Neon database connection successful! Ready for deployment."
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Connection failed"
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Network error while testing connection"
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-deep-900 via-blue-deep-800 to-slate-900">
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Database className="h-6 w-6 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Connect Neon Database</h1>
          </div>
          <p className="text-slate-400">Configure your Neon PostgreSQL database connection</p>
        </header>

        {/* Current Status */}
        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                dbStatus === "online" 
                  ? "bg-green-500/20 border border-green-500/30" 
                  : dbStatus === "offline"
                  ? "bg-red-500/20 border border-red-500/30"
                  : "bg-yellow-500/20 border border-yellow-500/30"
              }`}>
                {dbStatus === "online" ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : dbStatus === "offline" ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
                )}
                <span className={`font-medium ${
                  dbStatus === "online" 
                    ? "text-green-400" 
                    : dbStatus === "offline"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}>
                  {dbStatus === "online" ? "Connected" : dbStatus === "offline" ? "Disconnected" : "Checking"}
                </span>
              </div>
              <Button
                onClick={checkDbHealth}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
              >
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Neon Setup Instructions */}
        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-green-400" />
              Get Your Neon Connection String
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-slate-300">
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600 text-white mt-1">1</Badge>
                <div>
                  <p className="font-medium">Go to your Neon Console</p>
                  <p className="text-slate-400 text-sm">Visit <a href="https://console.neon.tech" target="_blank" className="text-green-400 hover:underline">console.neon.tech</a> and sign in</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600 text-white mt-1">2</Badge>
                <div>
                  <p className="font-medium">Select your project and database</p>
                  <p className="text-slate-400 text-sm">Choose the project containing your database</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600 text-white mt-1">3</Badge>
                <div>
                  <p className="font-medium">Copy the connection string</p>
                  <p className="text-slate-400 text-sm">Go to "Connection Details" and copy the PostgreSQL connection string</p>
                </div>
              </div>
            </div>
            
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                Your Neon connection string should look like: <br />
                <code className="text-xs bg-slate-800 px-2 py-1 rounded mt-1 inline-block">
                  postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
                </code>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Connection Test */}
        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              Test Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Neon Database URL</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require"
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 flex-1"
                />
                <Button
                  onClick={() => copyToClipboard(dbUrl)}
                  variant="outline"
                  size="icon"
                  className="border-slate-600 text-slate-300"
                  disabled={!dbUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={testConnection}
              disabled={testing || !dbUrl.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {testing ? "Testing Connection..." : "Test Connection"}
            </Button>

            {testResult && (
              <Alert className={testResult.success ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <AlertDescription className={testResult.success ? "text-green-300" : "text-red-300"}>
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Deployment Instructions */}
        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-purple-400" />
              Next Steps for Deployment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-slate-300">
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-600 text-white mt-1">1</Badge>
                <div>
                  <p className="font-medium">Test your connection above</p>
                  <p className="text-slate-400 text-sm">Make sure the connection test passes before deploying</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-600 text-white mt-1">2</Badge>
                <div>
                  <p className="font-medium">Deploy via Netlify MCP</p>
                  <p className="text-slate-400 text-sm">Click "Open MCP popover" in the top bar and connect Netlify</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-600 text-white mt-1">3</Badge>
                <div>
                  <p className="font-medium">Set environment variables</p>
                  <p className="text-slate-400 text-sm">In Netlify, add these environment variables:</p>
                  <div className="mt-2 space-y-1 text-xs font-mono bg-slate-800/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400">DATABASE_URL</span>
                      <Button
                        onClick={() => copyToClipboard("DATABASE_URL")}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-400">NETLIFY_DATABASE_URL</span>
                      <Button
                        onClick={() => copyToClipboard("NETLIFY_DATABASE_URL")}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-600 text-white mt-1">4</Badge>
                <div>
                  <p className="font-medium">Deploy and verify</p>
                  <p className="text-slate-400 text-sm">After deployment, check /api/health and /api/db/health endpoints</p>
                </div>
              </div>
            </div>

            <Alert className="bg-blue-500/10 border-blue-500/30">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Important:</strong> Set both DATABASE_URL and NETLIFY_DATABASE_URL to the same Neon connection string for best compatibility.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">Neon Console</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Access your Neon database dashboard to get connection details
              </p>
              <Button
                onClick={() => window.open("https://console.neon.tech", "_blank")}
                className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Neon Console
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">Deploy Page</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Go to the deployment page for complete setup instructions
              </p>
              <Button
                onClick={() => window.location.href = "/deploy"}
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Go to Deploy
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Connection String Format */}
        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-slate-400" />
              Connection String Format
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Neon Database URL</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Paste your Neon connection string here"
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 flex-1"
                />
                <Button
                  onClick={testConnection}
                  disabled={testing || !dbUrl.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Test"
                  )}
                </Button>
              </div>
            </div>

            {testResult && (
              <Alert className={testResult.success ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <AlertDescription className={testResult.success ? "text-green-300" : "text-red-300"}>
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-slate-800/30 p-4 rounded-lg">
              <p className="text-slate-300 text-sm mb-2">Expected format:</p>
              <code className="text-xs text-green-400 bg-slate-800 px-2 py-1 rounded block">
                postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
              </code>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}