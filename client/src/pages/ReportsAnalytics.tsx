import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import {
  BarChart3, TrendingUp, ShieldCheck, CreditCard, Gavel,
  Building2, AlertTriangle, Download, FileText, Filter,
  ChevronRight, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = "#e91e8c";
const TEAL = "#06b6d4";
const GREEN = "#10b981";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const PURPLE = "#8b5cf6";
const PALETTE = [ACCENT, TEAL, GREEN, AMBER, PURPLE, RED, "#f97316"];

const REPORT_SECTIONS = [
  { id: "revenue",       label: "Revenue",          icon: TrendingUp,    description: "Monthly & quarterly revenue trends" },
  { id: "compliance",    label: "Compliance",        icon: ShieldCheck,   description: "OMC compliance scores & status" },
  { id: "sicpa",         label: "SICPA Discrepancies", icon: AlertTriangle, description: "Volume variance analysis" },
  { id: "payments",      label: "Payments",          icon: CreditCard,    description: "Payment collection summary" },
  { id: "enforcement",   label: "Enforcement",       icon: Gavel,         description: "Cases & assessments" },
  { id: "omcPerformance",label: "OMC Performance",   icon: Building2,     description: "Ranking & performance metrics" },
  { id: "penalties",     label: "Penalties",         icon: FileText,      description: "Penalty & interest register" },
];

const PRODUCT_TYPES = ["petrol", "diesel", "kerosene", "lpg", "jet_fuel"];
const QUARTERS = [1, 2, 3, 4];
const YEARS = [2024, 2025, 2026];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number | string | null | undefined, dec = 0) => {
  const v = Number(n ?? 0);
  if (isNaN(v)) return "0";
  return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};
const fmtM = (n: number) => `NLE ${(n / 1_000_000).toFixed(2)}M`;

function exportCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c ?? ""}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(reportTitle: string, tableId: string) {
  const el = document.getElementById(tableId);
  if (!el) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<html><head><title>${reportTitle}</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:20px}
    h1{font-size:16px;color:#1e2a4a;margin-bottom:4px}p.meta{color:#666;font-size:10px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}th{background:#1e2a4a;color:white;padding:6px 8px;text-align:left;font-size:10px}
    td{padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:10px}tr:nth-child(even) td{background:#f9fafb}
    .footer{margin-top:20px;font-size:9px;color:#999;text-align:center}</style></head><body>
    <h1>National Revenue Authority — Sierra Leone</h1>
    <h2 style="font-size:13px;margin:0 0 4px">${reportTitle}</h2>
    <p class="meta">Generated: ${new Date().toLocaleString()} | FIS Platform</p>
    ${el.outerHTML}
    <div class="footer">CONFIDENTIAL — For official NRA use only</div></body></html>`);
  win.document.close(); win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Filters {
  omcId?: number;
  year?: number;
  quarter?: number;
  productType?: string;
  paymentStatus?: string;
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, omcList, showProduct, showPaymentStatus, showPeriod }: {
  filters: Filters;
  onChange: (f: Filters) => void;
  omcList: { id: number; companyName: string }[];
  showProduct?: boolean;
  showPaymentStatus?: boolean;
  showPeriod?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center p-3 bg-secondary/20 rounded-lg border border-border/40">
      <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
      <Select value={filters.omcId ? String(filters.omcId) : "all"}
        onValueChange={v => onChange({ ...filters, omcId: v === "all" ? undefined : Number(v) })}>
        <SelectTrigger className="h-8 w-44 text-xs bg-background/60"><SelectValue placeholder="All OMCs" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All OMCs</SelectItem>
          {omcList.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.companyName}</SelectItem>)}
        </SelectContent>
      </Select>
      {showPeriod && <>
        <Select value={filters.year ? String(filters.year) : "all"} onValueChange={v => onChange({ ...filters, year: v === "all" ? undefined : Number(v) })}>
          <SelectTrigger className="h-8 w-28 text-xs bg-background/60"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.quarter ? String(filters.quarter) : "all"} onValueChange={v => onChange({ ...filters, quarter: v === "all" ? undefined : Number(v) })}>
          <SelectTrigger className="h-8 w-28 text-xs bg-background/60"><SelectValue placeholder="Quarter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quarters</SelectItem>
            {QUARTERS.map(q => <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>)}
          </SelectContent>
        </Select>
      </>}
      {showProduct && (
        <Select value={filters.productType ?? "all"} onValueChange={v => onChange({ ...filters, productType: v === "all" ? undefined : v })}>
          <SelectTrigger className="h-8 w-36 text-xs bg-background/60"><SelectValue placeholder="Product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {PRODUCT_TYPES.map(p => <SelectItem key={p} value={p}>{p.replace("_", " ").toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {showPaymentStatus && (
        <Select value={filters.paymentStatus ?? "all"} onValueChange={v => onChange({ ...filters, paymentStatus: v === "all" ? undefined : v })}>
          <SelectTrigger className="h-8 w-36 text-xs bg-background/60"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["pending","processing","completed","failed","reversed"].map(s => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => onChange({})}>
        <RefreshCw className="w-3 h-3 mr-1" /> Reset
      </Button>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-lg p-3 shadow-xl text-xs min-w-[140px]">
      {label && <p className="font-semibold text-foreground mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </span>
          <span className="font-medium text-foreground">{typeof p.value === "number" ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── KPI Row ──────────────────────────────────────────────────────────────────
function KpiRow({ items }: { items: { label: string; value: string; color: string }[] }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map(k => (
        <div key={k.label} className="bg-secondary/20 rounded-lg p-3 border border-border/30 flex items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-lg font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Export Buttons ───────────────────────────────────────────────────────────
function ExportBtns({ csvFn, pdfFn }: { csvFn: () => void; pdfFn: () => void }) {
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={csvFn}>
        <Download className="w-3 h-3" /> CSV
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={pdfFn}>
        <FileText className="w-3 h-3" /> PDF
      </Button>
    </div>
  );
}

// ─── Revenue Report ───────────────────────────────────────────────────────────
function RevenueReport({ omcList }: { omcList: { id: number; companyName: string }[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const { data = [], isLoading } = trpc.reports.revenue.useQuery(filters);

  const chartData = useMemo(() => {
    const byPeriod: Record<string, { period: string; excise: number; vat: number; levy: number; total: number }> = {};
    data.forEach((r: any) => {
      const key = `${r.periodYear} Q${r.periodQuarter}`;
      if (!byPeriod[key]) byPeriod[key] = { period: key, excise: 0, vat: 0, levy: 0, total: 0 };
      byPeriod[key].excise += Number(r.exciseDutyAmount ?? 0);
      byPeriod[key].vat += Number(r.vatAmount ?? 0);
      byPeriod[key].levy += Number(r.levyAmount ?? 0);
      byPeriod[key].total += Number(r.totalTaxDue ?? 0);
    });
    return Object.values(byPeriod).sort((a, b) => a.period.localeCompare(b.period));
  }, [data]);

  const totalRevenue = data.reduce((s: number, r: any) => s + Number(r.totalTaxDue ?? 0), 0);
  const totalVolume = data.reduce((s: number, r: any) => s + Number(r.totalDeclaredVolume ?? 0), 0);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={setFilters} omcList={omcList} showPeriod showProduct />
      <KpiRow items={[
        { label: "Total Revenue", value: fmtM(totalRevenue), color: ACCENT },
        { label: "Total Volume (L)", value: `${fmt(totalVolume)}L`, color: TEAL },
        { label: "Returns Filed", value: String(data.length), color: GREEN },
      ]} />
      <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Revenue by Tax Type per Quarter</h3>
          <ExportBtns
            csvFn={() => exportCSV("revenue_report", ["Period","Excise Duty","VAT","Petroleum Levy","Total"],
              chartData.map(r => [r.period, r.excise, r.vat, r.levy, r.total]))}
            pdfFn={() => exportPDF("Revenue Report", "revenue-table")} />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tickFormatter={v => `${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip content={<CT />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="excise" name="Excise Duty" fill={ACCENT} radius={[3,3,0,0]} />
            <Bar dataKey="vat" name="VAT" fill={TEAL} radius={[3,3,0,0]} />
            <Bar dataKey="levy" name="Petroleum Levy" fill={GREEN} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
        <h3 className="text-sm font-semibold mb-3">Revenue Trend (Total)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tickFormatter={v => `${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip content={<CT />} />
            <Area type="monotone" dataKey="total" name="Total Revenue" stroke={ACCENT} fill="url(#totalGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
        <h3 className="text-sm font-semibold mb-3">Detailed Revenue Register</h3>
        <div className="overflow-x-auto">
          <table id="revenue-table" className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {["OMC","Period","Excise Duty","VAT","Petroleum Levy","Total Due","Volume (L)","Status"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                : data.length === 0 ? <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No data for selected filters</td></tr>
                : (data as any[]).map((r, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="py-2 px-3 font-medium">{r.companyName ?? `OMC #${r.omcId}`}</td>
                    <td className="py-2 px-3">{r.periodYear} Q{r.periodQuarter}</td>
                    <td className="py-2 px-3">NLE {fmt(r.exciseDutyAmount)}</td>
                    <td className="py-2 px-3">NLE {fmt(r.vatAmount)}</td>
                    <td className="py-2 px-3">NLE {fmt(r.levyAmount)}</td>
                    <td className="py-2 px-3 font-semibold" style={{ color: ACCENT }}>NLE {fmt(r.totalTaxDue)}</td>
                    <td className="py-2 px-3">{fmt(r.totalDeclaredVolume)} L</td>
                    <td className="py-2 px-3"><Badge variant="outline" className="text-[10px]">{r.status}</Badge></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Compliance Report ────────────────────────────────────────────────────────
function ComplianceReport({ omcList }: { omcList: { id: number; companyName: string }[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const { data = [], isLoading } = trpc.reports.compliance.useQuery(filters);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    (data as any[]).forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={setFilters} omcList={omcList} />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
          <h3 className="text-sm font-semibold mb-3">OMC Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusCounts.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip content={<CT />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
          <h3 className="text-sm font-semibold mb-3">OMC Count by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusCounts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} width={70} />
              <Tooltip content={<CT />} />
              <Bar dataKey="value" name="OMCs" radius={[0,4,4,0]}>
                {statusCounts.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">OMC Compliance Register</h3>
          <ExportBtns
            csvFn={() => exportCSV("compliance_report", ["OMC","Reg No.","Status","License Expiry"],
              (data as any[]).map(r => [r.companyName, r.registrationNumber, r.status, r.licenseExpiry ? new Date(r.licenseExpiry).toLocaleDateString() : "N/A"]))}
            pdfFn={() => exportPDF("Compliance Report", "compliance-table")} />
        </div>
        <div className="overflow-x-auto">
          <table id="compliance-table" className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {["OMC Name","Reg. Number","Status","License Expiry"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                : (data as any[]).map((r, i) => {
                  const sc = r.status === "active" ? GREEN : r.status === "suspended" ? AMBER : RED;
                  return (
                    <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-2 px-3 font-medium">{r.companyName}</td>
                      <td className="py-2 px-3 font-mono text-muted-foreground">{r.registrationNumber}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: sc, color: sc }}>{r.status}</Badge>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{r.licenseExpiry ? new Date(r.licenseExpiry).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── SICPA Report ─────────────────────────────────────────────────────────────
function SicpaReport({ omcList }: { omcList: { id: number; companyName: string }[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const { data = [], isLoading } = trpc.reports.sicpa.useQuery(filters);

  const chartData = useMemo(() => (data as any[]).map(r => ({
    name: (r.companyName ?? `OMC #${r.omcId}`).substring(0, 16),
    declared: Number(r.declaredVolumeLitres),
    verified: Number(r.verifiedVolumeLitres),
    variance: Math.abs(Number(r.varianceLitres ?? 0)),
    flag: r.discrepancyFlag,
  })), [data]);

  const totalLoss = (data as any[]).reduce((s, r) => s + Math.abs(Number(r.varianceLitres ?? 0)) * 5, 0);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={setFilters} omcList={omcList} showProduct />
      <KpiRow items={[
        { label: "Total Records", value: String(data.length), color: TEAL },
        { label: "Critical Flags", value: String((data as any[]).filter(r => r.discrepancyFlag === "critical").length), color: RED },
        { label: "Est. Revenue Loss", value: fmtM(totalLoss), color: AMBER },
      ]} />
      <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
        <h3 className="text-sm font-semibold mb-3">Declared vs Verified Volume by OMC</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tickFormatter={v => `${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip content={<CT />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="declared" name="Declared (L)" fill={TEAL} radius={[3,3,0,0]} />
            <Bar dataKey="verified" name="Verified (L)" fill={GREEN} radius={[3,3,0,0]} />
            <Bar dataKey="variance" name="Variance (L)" fill={RED} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">SICPA Discrepancy Register</h3>
          <ExportBtns
            csvFn={() => exportCSV("sicpa_report", ["OMC","Product","Declared (L)","Verified (L)","Variance (L)","Variance %","Flag"],
              (data as any[]).map(r => [r.companyName, r.productType, r.declaredVolumeLitres, r.verifiedVolumeLitres, r.varianceLitres, r.variancePercent, r.discrepancyFlag]))}
            pdfFn={() => exportPDF("SICPA Discrepancy Report", "sicpa-table")} />
        </div>
        <div className="overflow-x-auto">
          <table id="sicpa-table" className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {["OMC","Product","Declared (L)","Verified (L)","Variance (L)","Variance %","Flag","Date"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                : (data as any[]).map((r, i) => {
                  const fc = r.discrepancyFlag === "critical" ? RED : r.discrepancyFlag === "major" ? AMBER : r.discrepancyFlag === "minor" ? TEAL : GREEN;
                  return (
                    <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-2 px-3 font-medium">{r.companyName ?? `OMC #${r.omcId}`}</td>
                      <td className="py-2 px-3">{r.productType?.replace("_"," ").toUpperCase()}</td>
                      <td className="py-2 px-3">{fmt(r.declaredVolumeLitres)}</td>
                      <td className="py-2 px-3">{fmt(r.verifiedVolumeLitres)}</td>
                      <td className="py-2 px-3 text-red-400">{fmt(r.varianceLitres)}</td>
                      <td className="py-2 px-3 font-semibold" style={{ color: fc }}>{Number(r.variancePercent ?? 0).toFixed(1)}%</td>
                      <td className="py-2 px-3"><Badge variant="outline" className="text-[10px]" style={{ borderColor: fc, color: fc }}>{r.discrepancyFlag}</Badge></td>
                      <td className="py-2 px-3 text-muted-foreground">{r.verificationDate ? new Date(r.verificationDate).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Payments Report ──────────────────────────────────────────────────────────
function PaymentsReport({ omcList }: { omcList: { id: number; companyName: string }[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const { data = [], isLoading } = trpc.reports.payments.useQuery(filters);

  const byType = useMemo(() => {
    const c: Record<string, number> = {};
    (data as any[]).forEach(r => { c[r.paymentType] = (c[r.paymentType] ?? 0) + Number(r.amount); });
    return Object.entries(c).map(([name, value]) => ({ name: name.replace("_"," ").toUpperCase(), value }));
  }, [data]);

  const totalCollected = (data as any[]).filter(r => r.status === "completed").reduce((s, r) => s + Number(r.amount), 0);
  const totalPending = (data as any[]).filter(r => r.status === "pending" || r.status === "processing").reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={setFilters} omcList={omcList} showPaymentStatus />
      <KpiRow items={[
        { label: "Total Collected", value: fmtM(totalCollected), color: GREEN },
        { label: "Pending", value: fmtM(totalPending), color: AMBER },
        { label: "Total Transactions", value: String(data.length), color: TEAL },
      ]} />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
          <h3 className="text-sm font-semibold mb-3">Amount by Payment Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                label={({ percent }) => `${(percent*100).toFixed(0)}%`}>
                {byType.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip content={<CT />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
          <h3 className="text-sm font-semibold mb-3">Payment Type Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" tickFormatter={v => `${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#94a3b8" }} width={90} />
              <Tooltip content={<CT />} />
              <Bar dataKey="value" name="Amount (NLE)" radius={[0,4,4,0]}>
                {byType.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Payment Register</h3>
          <ExportBtns
            csvFn={() => exportCSV("payments_report", ["Ref","OMC","Type","Amount","Method","Status","Date"],
              (data as any[]).map(r => [r.paymentRef, r.companyName, r.paymentType, r.amount, r.paymentMethod, r.status, r.paidAt ? new Date(r.paidAt).toLocaleDateString() : ""]))}
            pdfFn={() => exportPDF("Payments Report", "payments-table")} />
        </div>
        <div className="overflow-x-auto">
          <table id="payments-table" className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {["Reference","OMC","Type","Amount","Method","Bank","Status","Date"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                : (data as any[]).map((r, i) => {
                  const sc = r.status === "completed" ? GREEN : r.status === "pending" ? AMBER : r.status === "failed" ? RED : TEAL;
                  return (
                    <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-2 px-3 font-mono text-xs">{r.paymentRef}</td>
                      <td className="py-2 px-3 font-medium">{r.companyName ?? `OMC #${r.omcId}`}</td>
                      <td className="py-2 px-3">{r.paymentType?.replace("_"," ")}</td>
                      <td className="py-2 px-3 font-semibold" style={{ color: ACCENT }}>NLE {fmt(r.amount)}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.paymentMethod?.replace("_"," ")}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.bankName ?? "—"}</td>
                      <td className="py-2 px-3"><Badge variant="outline" className="text-[10px]" style={{ borderColor: sc, color: sc }}>{r.status}</Badge></td>
                      <td className="py-2 px-3 text-muted-foreground">{r.paidAt ? new Date(r.paidAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Enforcement Report ───────────────────────────────────────────────────────
function EnforcementReport({ omcList }: { omcList: { id: number; companyName: string }[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const { data = [], isLoading } = trpc.reports.enforcement.useQuery(filters);

  const byStatus = useMemo(() => {
    const c: Record<string, number> = {};
    (data as any[]).forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [data]);

  const totalAssessed = (data as any[]).reduce((s, r) => s + Number(r.totalDue ?? 0), 0);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={setFilters} omcList={omcList} />
      <KpiRow items={[
        { label: "Total Cases", value: String(data.length), color: TEAL },
        { label: "Open Cases", value: String((data as any[]).filter(r => r.status === "open").length), color: RED },
        { label: "Total Assessed", value: fmtM(totalAssessed), color: AMBER },
      ]} />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
          <h3 className="text-sm font-semibold mb-3">Cases by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                {byStatus.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip content={<CT />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
          <h3 className="text-sm font-semibold mb-3">Assessed Amount by Case</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={(data as any[]).map(r => ({ name: r.caseRef, total: Number(r.totalDue ?? 0) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <YAxis tickFormatter={v => `${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Tooltip content={<CT />} />
              <Bar dataKey="total" name="Total Due (NLE)" fill={AMBER} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Enforcement Case Register</h3>
          <ExportBtns
            csvFn={() => exportCSV("enforcement_report", ["Case Ref","OMC","Type","Status","Assessed","Penalty","Total Due","Due Date"],
              (data as any[]).map(r => [r.caseRef, r.companyName, r.caseType, r.status, r.assessedAmount, r.penaltyAmount, r.totalDue, r.dueDate ? new Date(r.dueDate).toLocaleDateString() : ""]))}
            pdfFn={() => exportPDF("Enforcement Report", "enforcement-table")} />
        </div>
        <div className="overflow-x-auto">
          <table id="enforcement-table" className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {["Case Ref","OMC","Type","Status","Assessed","Penalty","Total Due","Due Date"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                : (data as any[]).map((r, i) => {
                  const sc = r.status === "resolved" ? GREEN : r.status === "open" ? RED : AMBER;
                  return (
                    <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-2 px-3 font-mono text-xs">{r.caseRef}</td>
                      <td className="py-2 px-3 font-medium">{r.companyName ?? `OMC #${r.omcId}`}</td>
                      <td className="py-2 px-3">{r.caseType?.replace("_"," ")}</td>
                      <td className="py-2 px-3"><Badge variant="outline" className="text-[10px]" style={{ borderColor: sc, color: sc }}>{r.status}</Badge></td>
                      <td className="py-2 px-3">NLE {fmt(r.assessedAmount)}</td>
                      <td className="py-2 px-3">NLE {fmt(r.penaltyAmount)}</td>
                      <td className="py-2 px-3 font-semibold" style={{ color: ACCENT }}>NLE {fmt(r.totalDue)}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── OMC Performance Report ───────────────────────────────────────────────────
function OmcPerformanceReport({ omcList }: { omcList: { id: number; companyName: string }[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const { data = [], isLoading } = trpc.reports.omcPerformance.useQuery(filters);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={setFilters} omcList={omcList} />
      <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
        <h3 className="text-sm font-semibold mb-3">OMC Status Ranking</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={(data as any[]).map(r => ({ name: (r.companyName ?? "").substring(0, 14), score: r.status === "active" ? 100 : r.status === "pending" ? 50 : 0 }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 100]} />
            <Tooltip content={<CT />} />
            <Bar dataKey="score" name="Status Score" radius={[4,4,0,0]}>
              {(data as any[]).map((r, i) => <Cell key={i} fill={r.status === "active" ? GREEN : r.status === "pending" ? AMBER : RED} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">OMC Performance Register</h3>
          <ExportBtns
            csvFn={() => exportCSV("omc_performance", ["OMC","Reg No.","Status","License Expiry"],
              (data as any[]).map(r => [r.companyName, r.registrationNumber, r.status, r.licenseExpiry ? new Date(r.licenseExpiry).toLocaleDateString() : "N/A"]))}
            pdfFn={() => exportPDF("OMC Performance Report", "omc-perf-table")} />
        </div>
        <div className="overflow-x-auto">
          <table id="omc-perf-table" className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {["#","OMC Name","Reg. Number","Status","License Expiry"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                : (data as any[]).map((r, i) => {
                  const sc = r.status === "active" ? GREEN : r.status === "pending" ? AMBER : RED;
                  return (
                    <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 px-3 font-medium">{r.companyName}</td>
                      <td className="py-2 px-3 font-mono text-muted-foreground">{r.registrationNumber}</td>
                      <td className="py-2 px-3"><Badge variant="outline" className="text-[10px]" style={{ borderColor: sc, color: sc }}>{r.status}</Badge></td>
                      <td className="py-2 px-3 text-muted-foreground">{r.licenseExpiry ? new Date(r.licenseExpiry).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Penalties Report ─────────────────────────────────────────────────────────
function PenaltiesReport({ omcList }: { omcList: { id: number; companyName: string }[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const { data = [], isLoading } = trpc.reports.penalties.useQuery(filters);

  const totalOutstanding = (data as any[]).filter(r => r.status === "outstanding" || r.status === "partial").reduce((s, r) => s + Number(r.totalDue ?? 0), 0);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={setFilters} omcList={omcList} />
      <KpiRow items={[
        { label: "Total Penalties", value: String(data.length), color: TEAL },
        { label: "Outstanding", value: String((data as any[]).filter(r => r.status === "outstanding").length), color: RED },
        { label: "Total Outstanding", value: fmtM(totalOutstanding), color: AMBER },
      ]} />
      <div className="bg-secondary/10 rounded-lg border border-border/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Penalty & Interest Register</h3>
          <ExportBtns
            csvFn={() => exportCSV("penalties_report", ["Ref","OMC","Type","Principal","Penalty","Interest","Total Due","Status","Due Date"],
              (data as any[]).map(r => [r.penaltyRef, r.companyName, r.penaltyType, r.principalAmount, r.penaltyAmount, r.interestAmount, r.totalDue, r.status, r.dueDate ? new Date(r.dueDate).toLocaleDateString() : ""]))}
            pdfFn={() => exportPDF("Penalties Report", "penalties-table")} />
        </div>
        <div className="overflow-x-auto">
          <table id="penalties-table" className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {["Reference","OMC","Type","Principal","Penalty","Interest","Total Due","Status","Due Date"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                : (data as any[]).map((r, i) => {
                  const sc = r.status === "paid" ? GREEN : r.status === "outstanding" ? RED : AMBER;
                  const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && r.status === "outstanding";
                  return (
                    <tr key={i} className={`border-b border-border/20 hover:bg-secondary/20 transition-colors ${isOverdue ? "bg-red-500/5" : ""}`}>
                      <td className="py-2 px-3 font-mono text-xs">{r.penaltyRef}</td>
                      <td className="py-2 px-3 font-medium">{r.companyName ?? `OMC #${r.omcId}`}</td>
                      <td className="py-2 px-3">{r.penaltyType?.replace("_"," ")}</td>
                      <td className="py-2 px-3">NLE {fmt(r.principalAmount)}</td>
                      <td className="py-2 px-3">NLE {fmt(r.penaltyAmount)}</td>
                      <td className="py-2 px-3">NLE {fmt(r.interestAmount)}</td>
                      <td className="py-2 px-3 font-semibold" style={{ color: ACCENT }}>NLE {fmt(r.totalDue)}</td>
                      <td className="py-2 px-3"><Badge variant="outline" className="text-[10px]" style={{ borderColor: sc, color: sc }}>{r.status}</Badge></td>
                      <td className="py-2 px-3" style={{ color: isOverdue ? RED : undefined }}>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsAnalytics() {
  const [activeSection, setActiveSection] = useState("revenue");
  const { data: omcList = [] } = trpc.omcs.list.useQuery({});
  const omcOptions = (omcList as any[]).map((o: any) => ({ id: o.id, companyName: o.companyName }));
  const activeReport = REPORT_SECTIONS.find(s => s.id === activeSection);

  const renderReport = () => {
    switch (activeSection) {
      case "revenue":        return <RevenueReport omcList={omcOptions} />;
      case "compliance":     return <ComplianceReport omcList={omcOptions} />;
      case "sicpa":          return <SicpaReport omcList={omcOptions} />;
      case "payments":       return <PaymentsReport omcList={omcOptions} />;
      case "enforcement":    return <EnforcementReport omcList={omcOptions} />;
      case "omcPerformance": return <OmcPerformanceReport omcList={omcOptions} />;
      case "penalties":      return <PenaltiesReport omcList={omcOptions} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Left sub-navigation */}
      <aside className="w-56 shrink-0 border-r border-border/40 bg-secondary/10 p-3 space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 py-1">Report Types</p>
        {REPORT_SECTIONS.map(s => {
          const isActive = activeSection === s.id;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"}`}
              style={isActive ? { background: `${ACCENT}18`, borderLeft: `3px solid ${ACCENT}` } : { borderLeft: "3px solid transparent" }}>
              <s.icon className="w-4 h-4 shrink-0" style={isActive ? { color: ACCENT } : {}} />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{s.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{s.description}</p>
              </div>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto shrink-0" style={{ color: ACCENT }} />}
            </button>
          );
        })}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports & Analytics</span>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: ACCENT }}>{activeReport?.label}</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{activeReport?.label} Report</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{activeReport?.description} — National Revenue Authority · Sierra Leone</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/20 px-3 py-1.5 rounded-full border border-border/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live Data
          </div>
        </div>
        <Separator className="mb-5 opacity-30" />
        {renderReport()}
      </div>
    </div>
  );
}
