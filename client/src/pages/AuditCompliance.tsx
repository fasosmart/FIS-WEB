import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MODULE_COLORS: Record<string, string> = {
  sicpa: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  enforcement: "bg-red-500/20 text-red-400 border-red-500/30",
  omc: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  tax_return: "bg-green-500/20 text-green-400 border-green-500/30",
  consignment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  system: "bg-secondary text-muted-foreground border-border",
};

export default function AuditCompliance() {
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  const { data: logs, isLoading } = trpc.audit.list.useQuery({ module: moduleFilter, limit: 100 });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit & Compliance</h1>
        <p className="text-sm text-muted-foreground mt-1">Full transaction traceability and comprehensive audit logging</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Audit Events", value: (logs ?? []).length, color: "text-foreground" },
          { label: "SICPA Events", value: (logs ?? []).filter((l) => l.module === "sicpa").length, color: "text-purple-400" },
          { label: "Enforcement Events", value: (logs ?? []).filter((l) => l.module === "enforcement").length, color: "text-red-400" },
          { label: "System Events", value: (logs ?? []).filter((l) => l.module === "system").length, color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="fis-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Select value={moduleFilter ?? "all"} onValueChange={(v) => setModuleFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-44 bg-card border-border text-foreground"><SelectValue placeholder="All Modules" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="sicpa">SICPA</SelectItem>
            <SelectItem value="enforcement">Enforcement</SelectItem>
            <SelectItem value="omc">OMC</SelectItem>
            <SelectItem value="tax_return">Tax Return</SelectItem>
            <SelectItem value="consignment">Consignment</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="fis-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {["Timestamp", "User", "Role", "Module", "Action", "Description"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading audit logs...</td></tr>
            ) : (logs ?? []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No audit events recorded yet. System actions will appear here automatically.
              </td></tr>
            ) : (logs ?? []).map((log) => (
              <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-foreground">User #{log.userId ?? "System"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{log.userRole ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded border font-medium ${MODULE_COLORS[log.module] ?? "bg-secondary text-muted-foreground border-border"}`}>
                    {log.module}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground">{log.action}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{log.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
