import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Truck, Plus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS: Record<string, string> = {
  in_transit: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  verified: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  flagged: "bg-red-500/20 text-red-400 border-red-500/30",
};

const PRODUCT_COLORS: Record<string, string> = {
  petrol: "text-yellow-400",
  diesel: "text-orange-400",
  kerosene: "text-blue-400",
  lpg: "text-green-400",
  jet_fuel: "text-purple-400",
};

export default function Consignments() {
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [form, setForm] = useState({
    consignmentRef: "", omcId: "", productType: "petrol" as const,
    declaredVolumeLitres: "", upliftDate: "", sourceTerminal: "",
    destinationDepot: "", vehicleReg: "", driverName: "",
  });

  const { data: consignments, isLoading, refetch } = trpc.consignments.list.useQuery({ status: statusFilter });
  const { data: omcs } = trpc.omcs.list.useQuery();
  const createMutation = trpc.consignments.create.useMutation({
    onSuccess: () => { toast.success("Consignment recorded"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consignments</h1>
          <p className="text-sm text-muted-foreground mt-1">Supply chain tracking and depot uplift transaction monitoring</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="fis-gradient text-white border-0 gap-2"><Plus className="w-4 h-4" /> Record Depot Uplift</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-lg">
            <DialogHeader><DialogTitle>Record Depot Uplift</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { key: "consignmentRef", label: "Consignment Ref *", placeholder: "CON-2026-001" },
                { key: "declaredVolumeLitres", label: "Declared Volume (L) *", placeholder: "50000" },
                { key: "upliftDate", label: "Uplift Date *", placeholder: "", type: "date" },
                { key: "sourceTerminal", label: "Source Terminal", placeholder: "Freetown Terminal" },
                { key: "destinationDepot", label: "Destination Depot", placeholder: "Bo Depot" },
                { key: "vehicleReg", label: "Vehicle Reg.", placeholder: "SL-001-ABC" },
                { key: "driverName", label: "Driver Name", placeholder: "John Kamara" },
              ].map((f) => (
                <div key={f.key}>
                  <Label className="text-xs text-muted-foreground mb-1 block">{f.label}</Label>
                  <Input type={f.type ?? "text"} placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="bg-background border-border text-foreground text-sm" />
                </div>
              ))}
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
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
              <Button className="fis-gradient text-white border-0" disabled={createMutation.isPending}
                onClick={() => createMutation.mutate({ ...form, omcId: Number(form.omcId) } as any)}>
                {createMutation.isPending ? "Recording..." : "Record Uplift"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Interactive Volume Chart */}
      {(consignments ?? []).length > 0 && (() => {
        const productVolumes: Record<string, number> = {};
        (consignments ?? []).forEach((c) => {
          const key = c.productType.replace("_", " ").toUpperCase();
          productVolumes[key] = (productVolumes[key] ?? 0) + Number(c.declaredVolumeLitres);
        });
        const chartData = Object.entries(productVolumes).map(([name, volume]) => ({
          name,
          volume,
          fill: name === "PETROL" ? "#f59e0b" : name === "DIESEL" ? "#f97316" : name === "KEROSENE" ? "#3b82f6" : name === "LPG" ? "#10b981" : "#8b5cf6",
        }));
        return (
          <div className="fis-card p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-foreground text-sm">Volume by Product Type (Litres)</h3>
              <span className="text-xs text-muted-foreground">Hover bars for details</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} barSize={32} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}K` : String(v)} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0];
                    return (
                      <div className="bg-[#1a1535] border border-purple-500/30 rounded-lg p-3 shadow-xl text-xs">
                        <p className="font-semibold text-white mb-1">{d.payload.name}</p>
                        <p style={{ color: d.payload.fill }} className="font-bold text-base">{Number(d.value).toLocaleString()} L</p>
                        <p className="text-gray-400">total declared volume</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  <LabelList dataKey="volume" position="top"
                    formatter={(v: number) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}K` : String(v)}
                    style={{ fill: "#9ca3af", fontSize: 10, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Consignments", value: (consignments ?? []).length, color: "text-foreground" },
          { label: "In Transit", value: (consignments ?? []).filter((c) => c.status === "in_transit").length, color: "text-blue-400" },
          { label: "Verified", value: (consignments ?? []).filter((c) => c.status === "verified").length, color: "text-purple-400" },
          { label: "Flagged", value: (consignments ?? []).filter((c) => c.status === "flagged").length, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="fis-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter ?? "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-44 bg-card border-border text-foreground"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="fis-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {["Ref", "OMC", "Product", "Declared Vol (L)", "Uplift Date", "Source → Destination", "Vehicle", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading consignments...</td></tr>
            ) : (consignments ?? []).length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No consignments recorded yet.
              </td></tr>
            ) : (consignments ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.consignmentRef}</td>
                <td className="px-4 py-3 font-medium text-foreground">{c.companyName ?? `OMC #${c.omcId}`}</td>
                <td className={`px-4 py-3 font-medium uppercase text-xs ${PRODUCT_COLORS[c.productType] ?? ""}`}>{c.productType.replace("_", " ")}</td>
                <td className="px-4 py-3 text-foreground">{Number(c.declaredVolumeLitres).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.upliftDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.sourceTerminal ?? "—"} → {c.destinationDepot ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.vehicleReg ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded border font-medium ${STATUS_COLORS[c.status] ?? ""}`}>
                    {c.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
