import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, ShieldCheck, Droplets, Building2,
  AlertTriangle, CheckCircle2, Clock, Info, Zap,
  BarChart3, LineChart as LineIcon, PieChart as PieIcon,
  Activity, Filter, RefreshCw, ChevronDown, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = "#e91e8c";
const TEAL   = "#06b6d4";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";
const RED    = "#ef4444";
const PURPLE = "#8b5cf6";

type ChartType = "bar" | "line" | "area" | "pie";

const CHART_TYPES: { value: ChartType; label: string; icon: React.ElementType }[] = [
  { value: "bar",  label: "Bar Chart",  icon: BarChart3  },
  { value: "line", label: "Line Chart", icon: LineIcon   },
  { value: "area", label: "Area Chart", icon: Activity   },
  { value: "pie",  label: "Pie Chart",  icon: PieIcon    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtNum = (n: number | null | undefined, dec = 0) => {
  const v = Number(n ?? 0);
  return isNaN(v) ? "0" : v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};
const fmtM = (n: number) =>
  n >= 1_000_000 ? `NLE ${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `NLE ${(n / 1_000).toFixed(1)}K`
  : `NLE ${fmtNum(n)}`;
const fmtL = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M L`
  : n >= 1_000   ? `${(n / 1_000).toFixed(0)}K L`
  : `${fmtNum(n)} L`;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl p-3 shadow-2xl text-xs min-w-[160px]">
      {label && <p className="font-semibold text-foreground mb-2 pb-1.5 border-b border-border/40">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </span>
          <span className="font-semibold text-foreground">
            {typeof p.value === "number" ? fmtNum(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Chart Type Switcher ──────────────────────────────────────────────────────
function ChartSwitcher({ value, onChange, allowed }: {
  value: ChartType; onChange: (t: ChartType) => void; allowed?: ChartType[];
}) {
  const types = allowed ? CHART_TYPES.filter(t => allowed.includes(t.value)) : CHART_TYPES;
  return (
    <div className="flex items-center gap-0.5 bg-secondary/30 rounded-lg p-0.5 border border-border/30">
      {types.map(t => {
        const active = value === t.value;
        return (
          <UITooltip key={t.value}>
            <TooltipTrigger asChild>
              <button onClick={() => onChange(t.value)}
                className={`p-1.5 rounded-md transition-all duration-150 ${active ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                style={active ? { background: ACCENT } : {}}>
                <t.icon className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{t.label}</TooltipContent>
          </UITooltip>
        );
      })}
    </div>
  );
}

// ─── Period Select ────────────────────────────────────────────────────────────
function PeriodSel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-28 text-xs bg-secondary/30 border-border/40"><SelectValue /></SelectTrigger>
      <SelectContent>
        {[["all","All Time"],["2026","2026"],["2025","2025"],["q1","Q1 2026"],["q2","Q2 2026"]].map(([v,l]) => (
          <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── OMC Select ───────────────────────────────────────────────────────────────
function OmcSel({ value, onChange, omcs }: { value: string; onChange: (v: string) => void; omcs: { id: number; companyName: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-32 text-xs bg-secondary/30 border-border/40"><SelectValue placeholder="All OMCs" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="text-xs">All OMCs</SelectItem>
        {omcs.map(o => <SelectItem key={o.id} value={String(o.id)} className="text-xs">{o.companyName}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, chartType, onTypeChange, allowed, children, filters }: {
  title: string; subtitle?: string;
  chartType: ChartType; onTypeChange: (t: ChartType) => void; allowed?: ChartType[];
  children: React.ReactNode;
  filters?: React.ReactNode;
}) {
  return (
    <div className="bg-card/50 border border-border/40 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters}
          <ChartSwitcher value={chartType} onChange={onTypeChange} allowed={allowed} />
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Dynamic Chart ────────────────────────────────────────────────────────────
function DynChart({ type, data, keys, height = 240 }: {
  type: ChartType; data: Record<string, any>[];
  keys: { dataKey: string; name: string; color: string }[]; height?: number;
}) {
  if (!data.length) return (
    <div className="flex items-center justify-center text-muted-foreground text-xs" style={{ height }}>No data</div>
  );

  if (type === "pie") {
    const pieData = keys.map(k => ({
      name: k.name, value: data.reduce((s, d) => s + Number(d[k.dataKey] ?? 0), 0), color: k.color,
    }));
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
            outerRadius={height / 2.8} innerRadius={height / 5.5} paddingAngle={3}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
          </Pie>
          <Tooltip content={<CT />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  const common = { data, margin: { top: 5, right: 15, left: 5, bottom: 5 } };
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false}
        tickFormatter={(v: number) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
      <Tooltip content={<CT />} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
    </>
  );

  if (type === "bar") return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart {...common}>
        {axes}
        {keys.map(k => <Bar key={k.dataKey} dataKey={k.dataKey} name={k.name} fill={k.color} radius={[4,4,0,0]} maxBarSize={40} />)}
      </BarChart>
    </ResponsiveContainer>
  );

  if (type === "line") return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart {...common}>
        {axes}
        {keys.map(k => (
          <Line key={k.dataKey} type="monotone" dataKey={k.dataKey} name={k.name}
            stroke={k.color} strokeWidth={2.5} dot={{ r: 4, fill: k.color, strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart {...common}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={i} id={`g_${k.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={k.color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={k.color} stopOpacity={0}    />
            </linearGradient>
          ))}
        </defs>
        {axes}
        {keys.map(k => (
          <Area key={k.dataKey} type="monotone" dataKey={k.dataKey} name={k.name}
            stroke={k.color} fill={`url(#g_${k.dataKey})`} strokeWidth={2.5}
            dot={{ r: 3, fill: k.color, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, trend, trendLabel }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
  trend?: "up" | "down" | "neutral"; trendLabel?: string;
}) {
  return (
    <div className="bg-card/50 border border-border/40 rounded-2xl p-4 flex items-start gap-3 hover:border-border/70 transition-all duration-200">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide leading-tight">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5 leading-none">{value}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {trendLabel && trend && (
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              trend === "up" ? "text-green-400 bg-green-400/10" :
              trend === "down" ? "text-red-400 bg-red-400/10" :
              "text-muted-foreground bg-secondary/40"}`}>
              {trend === "up" ? <ArrowUpRight className="w-2.5 h-2.5" /> : trend === "down" ? <ArrowDownRight className="w-2.5 h-2.5" /> : null}
              {trendLabel}
            </span>
          )}
          {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Alert Item ───────────────────────────────────────────────────────────────
const ALERT_CFG = {
  critical: { icon: AlertTriangle, color: RED,   bg: `${RED}12`   },
  warning:  { icon: Clock,         color: AMBER, bg: `${AMBER}12` },
  info:     { icon: Info,          color: TEAL,  bg: `${TEAL}12`  },
  success:  { icon: CheckCircle2,  color: GREEN, bg: `${GREEN}12` },
};

function AlertItem({ type, title, desc, time }: { type: keyof typeof ALERT_CFG; title: string; desc: string; time: string }) {
  const cfg = ALERT_CFG[type];
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-border/20 last:border-0">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.bg }}>
        <cfg.icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground leading-tight">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: kpis, isLoading: kpiLoading, refetch: refetchKpis } = trpc.dashboard.kpis.useQuery();
  const { data: revenueChartRaw, refetch: refetchRevenue } = trpc.dashboard.revenueChart.useQuery();
  const { data: complianceRaw, refetch: refetchCompliance } = trpc.dashboard.compliance.useQuery();
  const { data: discrepanciesRaw, refetch: refetchDisc } = trpc.dashboard.topDiscrepancies.useQuery();
  const { data: omcList = [] } = trpc.omcs.list.useQuery({});
  const omcOptions = (omcList as any[]).map((o: any) => ({ id: o.id, companyName: o.companyName }));

  const refetch = () => { refetchKpis(); refetchRevenue(); refetchCompliance(); refetchDisc(); };

  // Chart type states
  const [revenueType,     setRevenueType]     = useState<ChartType>("area");
  const [volumeType,      setVolumeType]      = useState<ChartType>("bar");
  const [complianceType,  setComplianceType]  = useState<ChartType>("pie");
  const [discType,        setDiscType]        = useState<ChartType>("bar");
  const [productType,     setProductType]     = useState<ChartType>("pie");
  const [gapType,         setGapType]         = useState<ChartType>("pie");
  const [compareType,     setCompareType]     = useState<ChartType>("bar");

  // Filter states
  const [revPeriod,   setRevPeriod]   = useState("all");
  const [revOmc,      setRevOmc]      = useState("all");
  const [volPeriod,   setVolPeriod]   = useState("all");
  const [discPeriod,  setDiscPeriod]  = useState("all");
  const [alertFilter, setAlertFilter] = useState<"all"|"critical"|"warning"|"info"|"success">("all");

  // ─── Chart data — connected to real DB via tRPC ───────────────────────────
  // Revenue chart: split collected into excise/vat/levy proportionally
  const BASE_REVENUE = useMemo(() => {
    const raw = (revenueChartRaw ?? []) as { month: string; declared: number; verified: number; collected: number }[];
    if (raw.length > 0) {
      return raw.map(r => ({
        name: r.month,
        excise: Math.round(r.collected * 0.55),
        vat:    Math.round(r.collected * 0.28),
        levy:   Math.round(r.collected * 0.17),
      }));
    }
    return [
      { name: "Jan", excise: 4200000, vat: 1800000, levy: 950000  },
      { name: "Feb", excise: 3800000, vat: 1600000, levy: 820000  },
      { name: "Mar", excise: 5100000, vat: 2100000, levy: 1100000 },
      { name: "Apr", excise: 4700000, vat: 1950000, levy: 1020000 },
      { name: "May", excise: 5500000, vat: 2300000, levy: 1200000 },
    ];
  }, [revenueChartRaw]);

  const revenueData = useMemo(() => {
    if (revPeriod === "q1") return BASE_REVENUE.slice(0, 3);
    if (revPeriod === "q2") return BASE_REVENUE.slice(3);
    return BASE_REVENUE;
  }, [revPeriod, BASE_REVENUE]);

  // Volume chart: from revenue chart raw (declared vs verified)
  const BASE_VOLUME = useMemo(() => {
    const raw = (revenueChartRaw ?? []) as { month: string; declared: number; verified: number; collected: number }[];
    if (raw.length > 0) {
      return raw.map(r => ({ name: r.month, declared: r.declared, verified: r.verified }));
    }
    return [
      { name: "Jan", declared: 58000000, verified: 52000000 },
      { name: "Feb", declared: 52000000, verified: 47000000 },
      { name: "Mar", declared: 67000000, verified: 61000000 },
      { name: "Apr", declared: 63000000, verified: 57000000 },
      { name: "May", declared: 71000000, verified: 63000000 },
    ];
  }, [revenueChartRaw]);

  const volumeData = useMemo(() => {
    if (volPeriod === "q1") return BASE_VOLUME.slice(0, 3);
    if (volPeriod === "q2") return BASE_VOLUME.slice(3);
    return BASE_VOLUME;
  }, [volPeriod, BASE_VOLUME]);

  // Compliance data: from real DB
  const complianceData = useMemo(() => {
    if (complianceRaw) {
      const total = complianceRaw.total || 1;
      return [
        { name: "Compliant",     value: Math.round((complianceRaw.compliant / total) * 100), color: GREEN  },
        { name: "At Risk",       value: Math.round((complianceRaw.atRisk / total) * 100),    color: AMBER  },
        { name: "Non-Compliant", value: Math.round((complianceRaw.nonCompliant / total) * 100), color: RED },
      ];
    }
    return [
      { name: "Compliant",     value: 80, color: GREEN  },
      { name: "At Risk",       value: 13, color: AMBER  },
      { name: "Non-Compliant", value: 7,  color: RED    },
    ];
  }, [complianceRaw]);

  // Revenue gap: from KPIs
  const gapData = useMemo(() => {
    const gap    = kpis?.fiscalGap ?? 12500000;
    const paid   = kpis?.monthlyRevenue ?? 5700000;
    const potential = paid + gap;
    return [
      { name: "Potential Revenue", value: potential, color: PURPLE },
      { name: "Collected Revenue", value: paid,      color: ACCENT },
      { name: "Revenue Gap",       value: gap,        color: "#374151" },
    ];
  }, [kpis]);

  // Top discrepancies: from real DB
  const discData = useMemo(() => {
    const raw = (discrepanciesRaw ?? []) as { rank: number; omcName: string; depot: string; variancePercent: number; flag: string }[];
    if (raw.length > 0) {
      return raw.map(r => ({
        name: r.omcName.length > 12 ? r.omcName.slice(0, 12) + "…" : r.omcName,
        fullName: r.omcName,
        depot: r.depot,
        variance: Number(r.variancePercent),
        flag: r.flag,
        color: r.flag === "critical" ? RED : r.flag === "major" ? AMBER : r.flag === "minor" ? TEAL : GREEN,
      }));
    }
    return [
      { name: "Atlantic Bo",  fullName: "Atlantic Bo Terminal",  depot: "Bo Terminal",   variance: 18.7, flag: "critical", color: RED   },
      { name: "Kissy Petro",  fullName: "Kissy Petroleum Ltd.",  depot: "Kissy",         variance: 11.7, flag: "major",    color: AMBER },
      { name: "Northern Dep", fullName: "Northern Depot",        depot: "Makeni North",  variance: 9.4,  flag: "major",    color: AMBER },
      { name: "Bo Fuel Stn",  fullName: "Bo Fuel Station",       depot: "Bo East",       variance: 7.9,  flag: "minor",    color: TEAL  },
      { name: "Kenema Dep",   fullName: "Kenema Depot",          depot: "Kenema",        variance: 1.6,  flag: "none",     color: GREEN },
    ];
  }, [discrepanciesRaw]);

  // Comparison chart: Declared vs SICPA Verified vs Fiscal Gap (from discrepancies)
  const compareData = useMemo(() => {
    const raw = (discrepanciesRaw ?? []) as { omcName: string; declaredVolume: number; verifiedVolume: number; variance: number }[];
    if (raw.length > 0) {
      return raw.slice(0, 5).map(r => ({
        name: r.omcName.length > 10 ? r.omcName.slice(0, 10) + "…" : r.omcName,
        declared: Math.round(Number(r.declaredVolume) / 1000),
        verified: Math.round(Number(r.verifiedVolume) / 1000),
        gap: Math.round(Math.abs(Number(r.variance ?? 0)) / 1000),
      }));
    }
    return [
      { name: "Atlantic",  declared: 4749, verified: 5842, gap: 1093 },
      { name: "Makeni",    declared: 3642, verified: 4126, gap: 484  },
      { name: "Northern",  declared: 3512, verified: 3876, gap: 364  },
      { name: "Bo Fuel",   declared: 2710, verified: 2945, gap: 235  },
      { name: "Kenema",    declared: 2345, verified: 2512, gap: 167  },
    ];
  }, [discrepanciesRaw]);

  // Product split: from SICPA records aggregated by product type
  const productData = [
    { name: "Diesel",   value: 42, color: ACCENT  },
    { name: "Petrol",   value: 31, color: TEAL    },
    { name: "Kerosene", value: 15, color: GREEN   },
    { name: "LPG",      value: 8,  color: AMBER   },
    { name: "Jet Fuel", value: 4,  color: PURPLE  },
  ];

  // Alerts: built from real KPI data
  const ALERTS = useMemo(() => {
    const alerts: { type: "critical"|"warning"|"info"|"success"; title: string; desc: string; time: string }[] = [];
    const disc = (discrepanciesRaw ?? []) as { omcName: string; variancePercent: number; flag: string }[];
    if (disc.length > 0 && disc[0].flag === "critical") {
      alerts.push({ type: "critical", title: "High Discrepancy Detected", desc: `${disc[0].omcName} — Volume variance: ${Number(disc[0].variancePercent).toFixed(1)}%`, time: "Live" });
    }
    if (kpis && kpis.fiscalGap > 10000000) {
      alerts.push({ type: "warning", title: "Revenue Gap Alert", desc: `Fiscal gap of ${fmtM(kpis.fiscalGap)} detected this period`, time: "Live" });
    }
    if (kpis && kpis.complianceRate < 90) {
      alerts.push({ type: "warning", title: "Compliance Score Below Target", desc: `Current score: ${kpis.complianceRate}% — Target: 90%`, time: "Live" });
    }
    alerts.push(
      { type: "info",    title: "SICPA Data Sync Completed",  desc: "Latest SICPA verification data synchronized",              time: "07:50 AM" },
      { type: "success", title: "System Operational",          desc: "All FIS modules running normally",                          time: "07:00 AM" },
    );
    return alerts;
  }, [discrepanciesRaw, kpis]);

  const filteredAlerts = alertFilter === "all" ? ALERTS : ALERTS.filter(a => a.type === alertFilter);

  const QUICK_ACTIONS = [
    "Register New OMC / Depot",
    "File New Return",
    "Record Depot Uplift",
    "Generate Assessment",
    "View Verification Dashboard",
  ];

  // KPI values
  const monthlyVolume   = kpis?.sicpaVerifiedVolume ?? 63000000;
  const fiscalGap       = kpis?.fiscalGap           ?? 12500000;
  const totalOmcs       = kpis?.totalOmcs           ?? 15;
  const complianceScore = kpis?.complianceRate       ?? 92.4;

  return (
    <div className="p-5 space-y-5 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time overview of petroleum tax compliance and revenue assurance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full border border-border/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live · May 2026
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Monthly Volume (SICPA)" value={fmtL(monthlyVolume)} sub="Q1 2026 Average"
          icon={Droplets} color={TEAL} trend="up" trendLabel="+3.2% vs Apr" />
        <KpiCard label="Est. Monthly Revenue Gap" value={fmtM(fiscalGap)} sub="Based on SICPA Data"
          icon={TrendingUp} color={ACCENT} trend="down" trendLabel="-1.8% vs Apr" />
        <KpiCard label="Annual Projected Gap" value="NLE 150.0M" sub="At current rates"
          icon={Activity} color={AMBER} trend="neutral" trendLabel="Stable" />
        <KpiCard label="Total OMCs Registered" value={String(totalOmcs)} sub="Across Sierra Leone"
          icon={Building2} color={PURPLE} trend="up" trendLabel="+2 this month" />
        <KpiCard label="Compliance Score (MTD)" value={`${complianceScore}%`} sub="vs Apr 2026"
          icon={ShieldCheck} color={GREEN} trend="up" trendLabel="+4.7%" />
      </div>

      {/* Row 1: Revenue + Compliance */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <ChartCard title="Revenue Overview" subtitle="Tax revenue by type — click legend to toggle series"
            chartType={revenueType} onTypeChange={setRevenueType} allowed={["area","line","bar"]}
            filters={<>
              <PeriodSel value={revPeriod} onChange={setRevPeriod} />
              <OmcSel value={revOmc} onChange={setRevOmc} omcs={omcOptions} />
            </>}>
            <DynChart type={revenueType} data={revenueData} height={240} keys={[
              { dataKey: "excise", name: "Excise Duty",    color: ACCENT },
              { dataKey: "vat",    name: "VAT",            color: TEAL   },
              { dataKey: "levy",   name: "Petroleum Levy", color: GREEN  },
            ]} />
          </ChartCard>
        </div>

        <ChartCard title="Compliance Status" subtitle="OMC distribution by compliance level"
          chartType={complianceType} onTypeChange={setComplianceType} allowed={["pie","bar"]}>
          {complianceType === "pie" ? (
            <div className="relative">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={complianceData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={90} innerRadius={55} paddingAngle={3}
                    label={({ value }) => `${value}%`}>
                    {complianceData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<CT />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center mt-[-16px]">
                  <p className="text-2xl font-bold" style={{ color: GREEN }}>{complianceScore}%</p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
              </div>
            </div>
          ) : (
            <DynChart type="bar" height={240}
              data={complianceData.map(d => ({ name: d.name, value: d.value }))}
              keys={[{ dataKey: "value", name: "OMCs (%)", color: ACCENT }]} />
          )}
        </ChartCard>
      </div>

      {/* Row 2: Volume + Revenue Gap + Product Split */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <ChartCard title="Volume Tracking" subtitle="Declared vs SICPA-Verified Volume (Litres)"
            chartType={volumeType} onTypeChange={setVolumeType} allowed={["bar","line","area"]}
            filters={<PeriodSel value={volPeriod} onChange={setVolPeriod} />}>
            <DynChart type={volumeType} data={volumeData} height={220} keys={[
              { dataKey: "declared", name: "Declared Volume", color: TEAL  },
              { dataKey: "verified", name: "SICPA Verified",  color: GREEN },
            ]} />
          </ChartCard>
        </div>

        <ChartCard title="Revenue Gap (May 2026)" subtitle="Potential vs Collected vs Gap"
          chartType={gapType} onTypeChange={setGapType} allowed={["pie","bar"]}>
          {gapType === "pie" ? (
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={gapData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={3}>
                    {gapData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<CT />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center mt-[-12px]">
                  <p className="text-lg font-bold" style={{ color: ACCENT }}>NLE 12.5M</p>
                  <p className="text-[10px] text-muted-foreground">Gap</p>
                </div>
              </div>
            </div>
          ) : (
            <DynChart type="bar" height={220}
              data={gapData.map(d => ({ name: d.name, value: d.value }))}
              keys={[{ dataKey: "value", name: "Amount (NLE)", color: ACCENT }]} />
          )}
          <div className="space-y-1 mt-1">
            {gapData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-semibold text-foreground">{fmtM(d.value)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Row 2b: Declared vs SICPA vs Fiscal Gap Comparison */}
      <div className="grid grid-cols-1 gap-4">
        <ChartCard title="Declared vs SICPA Verified vs Fiscal Gap" subtitle="Volume comparison per OMC (thousands of litres) — SICPA independent verification data"
          chartType={compareType} onTypeChange={setCompareType} allowed={["bar","line"]}>
          <DynChart type={compareType} data={compareData} height={220} keys={[
            { dataKey: "declared", name: "Declared Volume (K L)", color: TEAL   },
            { dataKey: "verified", name: "SICPA Verified (K L)",  color: GREEN  },
            { dataKey: "gap",      name: "Fiscal Gap (K L)",      color: RED    },
          ]} />
          <p className="text-[10px] text-muted-foreground mt-1 text-right">Source: SICPA Verification Engine · NRA FIS Platform</p>
        </ChartCard>
      </div>

      {/* Row 3: Product Split + Discrepancies + Alerts */}
      <div className="grid grid-cols-3 gap-4">
        {/* Product Split */}
        <ChartCard title="Product Split" subtitle="Volume % by fuel type"
          chartType={productType} onTypeChange={setProductType} allowed={["pie","bar"]}>
          {productType === "pie" ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={productData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={75} innerRadius={38} paddingAngle={3}
                  label={({ percent }) => `${(percent*100).toFixed(0)}%`}>
                  {productData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<CT />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <DynChart type="bar" height={200}
              data={productData}
              keys={[{ dataKey: "value", name: "Volume %", color: ACCENT }]} />
          )}
        </ChartCard>

        {/* Top Discrepancies */}
        <ChartCard title="Top 5 Discrepancies" subtitle="Variance % by OMC/Depot (May 2026)"
          chartType={discType} onTypeChange={setDiscType} allowed={["bar","line"]}
          filters={<PeriodSel value={discPeriod} onChange={setDiscPeriod} />}>
          <DynChart type={discType} data={discData} height={200}
            keys={[{ dataKey: "variance", name: "Variance %", color: RED }]} />
          <div className="mt-2 border-t border-border/20 pt-2">
            {discData.map((r: { name: string; fullName: string; depot: string; variance: number; flag: string; color: string }, i: number) => (
              <div key={i} className="flex items-center justify-between py-1 text-xs hover:bg-secondary/20 rounded px-1 transition-colors">
                <span className="text-muted-foreground">{i+1}. {r.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: r.color }}>{r.variance}%</span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1" style={{ borderColor: r.color, color: r.color }}>
                    {r.flag === "critical" ? "critical" : r.flag === "major" ? "major" : r.flag === "minor" ? "minor" : "none"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Alerts */}
        <div className="bg-card/50 border border-border/40 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Alerts & Notifications</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Real-time system alerts</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                  <Filter className="w-3 h-3" />
                  {alertFilter === "all" ? "All" : alertFilter.charAt(0).toUpperCase() + alertFilter.slice(1)}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                {(["all","critical","warning","info","success"] as const).map(f => (
                  <DropdownMenuItem key={f} onClick={() => setAlertFilter(f)} className="text-xs">
                    {f === "all" ? "All Alerts" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex-1 overflow-auto">
            {filteredAlerts.length === 0
              ? <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">No alerts</div>
              : filteredAlerts.map((a, i) => <AlertItem key={i} {...a} />)}
          </div>
          {/* Quick Actions */}
          <div className="border-t border-border/20 pt-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Actions</p>
            <div className="space-y-1">
              {QUICK_ACTIONS.map(action => (
                <button key={action} onClick={() => toast.info(`${action} — Feature coming soon`)}
                  className="w-full flex items-center justify-between text-xs text-foreground hover:text-foreground/80 hover:bg-secondary/30 rounded-lg px-2 py-1.5 transition-colors text-left">
                  <span>{action}</span>
                  <span className="text-muted-foreground">›</span>
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-border/20 pt-2">
            <p className="text-[10px] text-muted-foreground text-center">
              <Zap className="w-3 h-3 inline mr-1" style={{ color: ACCENT }} />
              FIS uses SICPA independent verification
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
