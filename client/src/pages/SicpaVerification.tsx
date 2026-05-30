import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ShieldCheck, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";

const FLAG_COLORS: Record<string, string> = {
  none: "bg-green-500/20 text-green-400 border-green-500/30",
  minor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  major: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function SicpaVerification() {
  const [open, setOpen] = useState(false);
  const [flagFilter, setFlagFilter] = useState<string | undefined>();
  const [form, setForm] = useState({
    omcId: "", productType: "petrol" as const,
    declaredVolumeLitres: "", verifiedVolumeLitres: "", notes: "",
  });

  const { data: records, isLoading, refetch } = trpc.sicpa.list.useQuery({ flag: flagFilter });
  const { data: omcs } = trpc.omcs.list.useQuery();
  const verifyMutation = trpc.sicpa.verify.useMutation({
    onSuccess: (data) => {
      const msg = data.flag === "none"
        ? `Verification complete. No discrepancy detected.`
        : `⚠️ ${data.flag?.toUpperCase()} discrepancy flagged: ${data.variancePercent}% variance`;
      data.flag === "none" ? toast.success(msg) : toast.error(msg);
      setOpen(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const critical = (records ?? []).filter((r) => r.discrepancyFlag === "critical").length;
  const major = (records ?? []).filter((r) => r.discrepancyFlag === "major").length;
  const minor = (records ?? []).filter((r) => r.discrepancyFlag === "minor").length;
  const clean = (records ?? []).filter((r) => r.discrepancyFlag === "none").length;

  const chartData = [
    { name: "Critical", count: critical, fill: "#ef4444" },
    { name: "Major", count: major, fill: "#f97316" },
    { name: "Minor", count: minor, fill: "#f59e0b" },
    { name: "Clean", count: clean, fill: "#10b981" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">SICPA Verification Engine</h1>
            <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">● LIVE</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Declared vs. verified volume comparison with automatic discrepancy flagging</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="fis-gradient text-white border-0 gap-2"><Plus className="w-4 h-4" /> Run Verification</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-md">
            <DialogHeader><DialogTitle>Run SICPA Verification</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">OMC *</Label>
                <Select value={form.omcId} onValueChange={(v) => setForm((p) => ({ ...p, omcId: v }))}>
                  <SelectTrigger className="bg-background border-border text-foreground text-sm"><SelectValue placeholder="Select OMC" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {(omcs ?? []).map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Product Type *</Label>
                <Select value={form.productType} onValueChange={(v) => setForm((p) => ({ ...p, productType: v as any }))}>
                  <SelectTrigger className="bg-background border-border text-foreground text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {["petrol", "diesel", "kerosene", "lpg", "jet_fuel"].map((p) => <SelectItem key={p} value={p}>{p.replace("_", " ").toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Declared Volume (L) *</Label>
                  <Input value={form.declaredVolumeLitres} onChange={(e) => setForm((p) => ({ ...p, declaredVolumeLitres: e.target.value }))}
                    placeholder="50000" className="bg-background border-border text-foreground text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">SICPA Verified Volume (L) *</Label>
                  <Input value={form.verifiedVolumeLitres} onChange={(e) => setForm((p) => ({ ...p, verifiedVolumeLitres: e.target.value }))}
                    placeholder="58000" className="bg-background border-border text-foreground text-sm" />
                </div>
              </div>
              {form.declaredVolumeLitres && form.verifiedVolumeLitres && (
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <p className="text-xs text-muted-foreground">Variance Preview</p>
                  <p className="text-sm font-bold text-foreground">
                    {Math.abs(Number(form.verifiedVolumeLitres) - Number(form.declaredVolumeLitres)).toLocaleString()} L
                    ({Number(form.declaredVolumeLitres) > 0
                      ? ((Math.abs(Number(form.verifiedVolumeLitres) - Number(form.declaredVolumeLitres)) / Number(form.declaredVolumeLitres)) * 100).toFixed(1)
                      : 0}%)
                  </p>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes..." className="bg-background border-border text-foreground text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
              <Button className="fis-gradient text-white border-0" disabled={verifyMutation.isPending}
                onClick={() => verifyMutation.mutate({ ...form, omcId: Number(form.omcId) } as any)}>
                {verifyMutation.isPending ? "Verifying..." : "Run Verification"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {[
            { label: "Critical Discrepancies", value: critical, color: "text-red-400", bg: "border-red-500/30" },
            { label: "Major Discrepancies", value: major, color: "text-orange-400", bg: "border-orange-500/30" },
            { label: "Minor Discrepancies", value: minor, color: "text-yellow-400", bg: "border-yellow-500/30" },
            { label: "Clean Verifications", value: clean, color: "text-green-400", bg: "border-green-500/30" },
          ].map((s) => (
            <div key={s.label} className={`fis-card p-4 ${s.bg}`}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="fis-card p-5">
          <h3 className="font-semibold text-foreground mb-1 text-sm">Discrepancy Distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">Hover bars for details</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={28} margin={{ top: 16, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0];
                  return (
                    <div className="bg-[#1a1535] border border-purple-500/30 rounded-lg p-3 shadow-xl text-xs">
                      <p className="font-semibold text-white mb-1">{d.payload.name} Discrepancies</p>
                      <p style={{ color: d.payload.fill }} className="font-bold text-lg">{d.value}</p>
                      <p className="text-gray-400">records flagged</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                <LabelList dataKey="count" position="top" style={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={flagFilter ?? "all"} onValueChange={(v) => setFlagFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-44 bg-card border-border text-foreground"><SelectValue placeholder="All Flags" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Flags</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="none">Clean</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="fis-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {["Verification Ref", "OMC", "Product", "Declared (L)", "Verified (L)", "Variance (L)", "Variance %", "Flag", "Date"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading SICPA records...</td></tr>
            ) : (records ?? []).length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No SICPA verification records found.
              </td></tr>
            ) : (records ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.verificationRef ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-foreground">{r.companyName ?? `OMC #${r.omcId}`}</td>
                <td className="px-4 py-3 text-xs uppercase text-muted-foreground">{r.productType.replace("_", " ")}</td>
                <td className="px-4 py-3 text-foreground">{Number(r.declaredVolumeLitres).toLocaleString()}</td>
                <td className="px-4 py-3 text-foreground">{Number(r.verifiedVolumeLitres).toLocaleString()}</td>
                <td className="px-4 py-3 text-foreground">{r.varianceLitres ? Number(r.varianceLitres).toLocaleString() : "—"}</td>
                <td className="px-4 py-3">
                  {r.variancePercent ? (
                    <span className={`font-bold ${r.discrepancyFlag === "critical" ? "text-red-400" : r.discrepancyFlag === "major" ? "text-orange-400" : r.discrepancyFlag === "minor" ? "text-yellow-400" : "text-green-400"}`}>
                      {Number(r.variancePercent).toFixed(1)}%
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded border font-medium ${FLAG_COLORS[r.discrepancyFlag] ?? ""}`}>
                    {r.discrepancyFlag === "none" ? "Clean" : r.discrepancyFlag}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.verificationDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
