import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function DeployPage() {
  return (
    <div className="p-6">
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Deploy</CardTitle>
          <CardDescription className="text-slate-400">
            Trigger deployments and view build status (connect Netlify or Vercel
            MCP to enable).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-slate-300">
            To deploy this app for free, connect the Netlify MCP from the
            top-right MCP panel. After connecting, you can trigger a deploy from
            here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
