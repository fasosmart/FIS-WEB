import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import {
  ArrowLeft, Building2, TrendingUp, Droplets, CreditCard,
  AlertTriangle, ShieldCheck, FileText, Clock, CheckCircle,
  XCircle, RefreshCw, BarChart3, Activity, ChevronRight,
  MapPin, Phone, Mail, User, Hash, Calendar, Zap,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = "#e91e8c";
const TEAL   = "#06b6d4";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";
const RED    = "#ef4444";
const PURPLE = "#8b5cf6";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: string | number | null | undefined, dec = 2) =>
  v !== null && v !== undefined
    ? `NLE ${Number(v).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}`
    : "—";
const fmtM = (n: number) =>
  n >= 1_000_000 ? `NLE ${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `NLE ${(n / 1_000).toFixed(1)}K`
  : `NLE ${n.toLocaleString()}`;
const fmtL = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M L`
  : n >= 1_000   ? `${(n / 1_000).toFixed(0)}K L`
  : `${n.toLocaleString()} L`;
const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─── Status configs ───────────────────────────────────────────────────────────
const OMC_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  active:    { label: "Active",    cls: "bg-green-500/15 text-green-400 border-green-500/30",   dot: "bg-green-400" },
  suspended: { label: "Suspended", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-400" },
  revoked:   { label: "Revoked",   cls: "bg-red-500/15 text-red-400 border-red-500/30",          dot: "bg-red-400" },
  pending:   { label: "Pending",   cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",       dot: "bg-blue-400" },
};

const TR_STATUS: Record<string, { label: string; cls: string }> = {
  draft:        { label: "Draft",        cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  submitted:    { label: "Submitted",    cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  under_review: { label: "Under Review", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  assessed:     { label: "Assessed",     cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  overdue:      { label: "Overdue",      cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const PAY_STATUS: Record<string, { label: string; cls: string }> = {
  completed:  { label: "Completed",  cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  pending:    { label: "Pending",    cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  processing: { label: "Processing", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  failed:     { label: "Failed",     cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  reversed:   { label: "Reversed",   cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

const PEN_STATUS: Record<string, { label: string; cls: string }> = {
  outstanding: { label: "Outstanding", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  partial:     { label: "Partial",     cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  paid:        { label: "Paid",        cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  waived:      { label: "Waived",      cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  appealed:    { label: "Appealed",    cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

const FLAG_CFG: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: RED    },
  major:    { label: "Major",    color: AMBER  },
  minor:    { label: "Minor",    color: TEAL   },
  none:     { label: "None",     color: GREEN  },
};

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
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-card/50 border border-border/40 rounded-2xl p-4 flex items-start gap-3
      hover:border-border/70 hover:bg-card/80 transition-all duration-200">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, color = ACCENT }: {
  icon: React.ElementType; title: string; subtitle?: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OmcDetail() {
  const { id } = useParams<{ id: string }>();
  const omcId = Number(id);

  const { data: omc, isLoading } = trpc.omcs.byId.useQuery({ id: omcId });
  const { data: taxReturnsRaw = [] } = trpc.taxReturns.list.useQuery({ omcId });
  const { data: consignmentsRaw = [] } = trpc.consignments.list.useQuery({ omcId });
  const { data: sicpaRaw = [] } = trpc.sicpa.list.useQuery({ omcId });
  const { data: paymentsRaw = [] } = trpc.payments.list.useQuery({ omcId });
  const { data: penaltiesRaw = [] } = trpc.penalties.list.useQuery({ omcId });

  const taxReturns = taxReturnsRaw as any[];
  const consignments = consignmentsRaw as any[];
  const sicpa = sicpaRaw as any[];
  const payments = paymentsRaw as any[];
  const penalties = penaltiesRaw as any[];

  // ─── Derived KPIs ─────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalDue    = taxReturns.reduce((s, r) => s + Number(r.totalTaxDue ?? 0), 0);
    const totalPaid   = taxReturns.reduce((s, r) => s + Number(r.totalPaid ?? 0), 0);
    const outstanding = totalDue - totalPaid;
    const totalVolume = consignments.reduce((s, c) => s + Number(c.declaredVolumeLitres ?? 0), 0);
    const sicpaVerified = sicpa.reduce((s, r) => s + Number(r.verifiedVolumeLitres ?? 0), 0);
    const sicpaDeclared = sicpa.reduce((s, r) => s + Number(r.declaredVolumeLitres ?? 0), 0);
    const totalPenalties = penalties.reduce((s, p) => s + Number(p.totalDue ?? 0), 0);
    const paidPenalties  = penalties.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.totalDue ?? 0), 0);
    const complianceRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
    return { totalDue, totalPaid, outstanding, totalVolume, sicpaVerified, sicpaDeclared, totalPenalties, paidPenalties, complianceRate };
  }, [taxReturns, consignments, sicpa, penalties]);

  // ─── Revenue trend chart ──────────────────────────────────────────────────
  const revenueTrend = useMemo(() => {
    const sorted = [...taxReturns].sort((a, b) =>
      a.periodYear !== b.periodYear ? a.periodYear - b.periodYear : a.periodQuarter - b.periodQuarter
    );
    return sorted.map(r => ({
      name: `Q${r.periodQuarter} ${r.periodYear}`,
      due:  Number(r.totalTaxDue ?? 0),
      paid: Number(r.totalPaid ?? 0),
      gap:  Math.max(0, Number(r.totalTaxDue ?? 0) - Number(r.totalPaid ?? 0)),
    }));
  }, [taxReturns]);

  // ─── Volume comparison chart ──────────────────────────────────────────────
  const volumeChart = useMemo(() => {
    return sicpa.map((r, i) => ({
      name: `Verif. ${i + 1}`,
      declared: Number(r.declaredVolumeLitres ?? 0),
      verified: Number(r.verifiedVolumeLitres ?? 0),
      variance: Math.abs(Number(r.varianceLitres ?? 0)),
    }));
  }, [sicpa]);

  // ─── Payment timeline ─────────────────────────────────────────────────────
  const paymentTimeline = useMemo(() => {
    const sorted = [...payments].sort((a, b) => new Date(b.paidAt ?? b.createdAt).getTime() - new Date(a.paidAt ?? a.createdAt).getTime());
    return sorted.slice(0, 8);
  }, [payments]);

  // ─── Product split ────────────────────────────────────────────────────────
  const productSplit = useMemo(() => {
    const map: Record<string, number> = {};
    consignments.forEach(c => {
      const pt = c.productType ?? "other";
      map[pt] = (map[pt] ?? 0) + Number(c.declaredVolumeLitres ?? 0);
    });
    const COLORS = [ACCENT, TEAL, GREEN, AMBER, PURPLE, RED];
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [consignments]);

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${ACCENT}40`, borderTopColor: ACCENT }} />
        <p className="text-sm text-muted-foreground">Loading OMC profile…</p>
      </div>
    </div>
  );
  if (!omc) return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <p className="text-sm text-muted-foreground">OMC not found.</p>
    </div>
  );

  const omcStatus = OMC_STATUS[omc.status] ?? OMC_STATUS.active;

  return (
    <div className="p-5 space-y-5 min-h-screen">

      {/* ── Back ── */}
      <div className="flex items-center gap-2">
        <Link href="/omcs">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to OMC Registry
          </span>
        </Link>
        <span className="text-muted-foreground/40 text-xs">›</span>
        <span className="text-xs text-foreground font-medium">{omc.companyName}</span>
      </div>

      {/* ── Header ── */}
      <div className="bg-card/50 border border-border/40 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 fis-gradient rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{omc.companyName}</h1>
                <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${omcStatus.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${omcStatus.dot} ${omc.status === "active" ? "animate-pulse" : ""}`} />
                  {omcStatus.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Hash className="w-3 h-3" />{omc.registrationNumber}</span>
                {omc.tinNumber && <span className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="w-3 h-3" />TIN: {omc.tinNumber}</span>}
                {omc.address && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{omc.address}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            {omc.contactPerson && <span className="flex items-center gap-1"><User className="w-3 h-3" />{omc.contactPerson}</span>}
            {omc.contactEmail   && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{omc.contactEmail}</span>}
            {omc.contactPhone   && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{omc.contactPhone}</span>}
          </div>
        </div>

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-border/20">
          {[
            { label: "Total Tax Due",     value: fmtM(kpis.totalDue),        icon: TrendingUp,  color: ACCENT },
            { label: "Total Paid",        value: fmtM(kpis.totalPaid),       icon: CheckCircle, color: GREEN  },
            { label: "Outstanding",       value: fmtM(kpis.outstanding),     icon: AlertTriangle, color: kpis.outstanding > 0 ? RED : GREEN },
            { label: "Compliance Rate",   value: `${kpis.complianceRate}%`,  icon: ShieldCheck, color: kpis.complianceRate >= 80 ? GREEN : kpis.complianceRate >= 50 ? AMBER : RED },
            { label: "Total Volume",      value: fmtL(kpis.totalVolume),     icon: Droplets,    color: TEAL   },
            { label: "Total Penalties",   value: fmtM(kpis.totalPenalties),  icon: FileText,    color: PURPLE },
          ].map(k => (
            <div key={k.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary/20 border border-border/20">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${k.color}18` }}>
                <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-tight">{k.label}</p>
                <p className="text-sm font-bold text-foreground mt-0.5 leading-none">{k.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="declarations" className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/30 h-9 gap-0.5 p-0.5">
          {[
            { value: "declarations", label: "Declarations", icon: FileText },
            { value: "volumes",      label: "Volumes & SICPA", icon: Droplets },
            { value: "payments",     label: "Payments", icon: CreditCard },
            { value: "penalties",    label: "Penalties", icon: AlertTriangle },
            { value: "analytics",    label: "Analytics", icon: BarChart3 },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value}
              className="flex items-center gap-1.5 text-xs h-8 px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md transition-all">
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Tab: Declarations ── */}
        <TabsContent value="declarations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue trend chart */}
            <div className="lg:col-span-2 bg-card/50 border border-border/40 rounded-2xl p-4">
              <SectionHeader icon={TrendingUp} title="Revenue Trend" subtitle="Tax due vs paid per quarter" color={ACCENT} />
              {revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gDue"  x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={ACCENT} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={GREEN} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false}
                      tickFormatter={(v: number) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
                    <Tooltip content={<CT />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="due"  name="Tax Due"  stroke={ACCENT} fill="url(#gDue)"  strokeWidth={2} dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="paid" name="Tax Paid" stroke={GREEN}  fill="url(#gPaid)" strokeWidth={2} dot={{ r: 3, fill: GREEN,  strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">No declaration data</div>
              )}
            </div>

            {/* Declaration list */}
            <div className="bg-card/50 border border-border/40 rounded-2xl p-4">
              <SectionHeader icon={FileText} title="Tax Returns" subtitle={`${taxReturns.length} declarations filed`} color={TEAL} />
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {taxReturns.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No tax returns filed yet.</p>
                ) : [...taxReturns].sort((a, b) =>
                    a.periodYear !== b.periodYear ? b.periodYear - a.periodYear : b.periodQuarter - a.periodQuarter
                  ).map((r: any) => {
                  const st = TR_STATUS[r.status] ?? TR_STATUS.draft;
                  const due  = Number(r.totalTaxDue ?? 0);
                  const paid = Number(r.totalPaid ?? 0);
                  const pct  = due > 0 ? Math.round((paid / due) * 100) : 0;
                  return (
                    <div key={r.id} className="p-2.5 rounded-xl bg-secondary/20 border border-border/20 hover:border-border/40 transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-foreground">Q{r.periodQuarter} {r.periodYear}</span>
                        <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${st.cls}`}>{st.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                        <span>Due: <span className="text-foreground font-medium">{fmt(due)}</span></span>
                        <span>Paid: <span className="text-green-400 font-medium">{fmt(paid)}</span></span>
                      </div>
                      <div className="w-full bg-secondary/40 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? GREEN : pct >= 50 ? AMBER : RED }} />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 text-right">{pct}% paid</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Volumes & SICPA ── */}
        <TabsContent value="volumes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Volume comparison chart */}
            <div className="lg:col-span-2 bg-card/50 border border-border/40 rounded-2xl p-4">
              <SectionHeader icon={Droplets} title="Declared vs SICPA Verified Volume" subtitle="Independent cross-verification data" color={TEAL} />
              {volumeChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={volumeChart} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false}
                      tickFormatter={(v: number) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
                    <Tooltip content={<CT />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="declared" name="Declared (L)" fill={TEAL}  radius={[4,4,0,0]} maxBarSize={36} />
                    <Bar dataKey="verified" name="SICPA Verified (L)" fill={GREEN} radius={[4,4,0,0]} maxBarSize={36} />
                    <Bar dataKey="variance" name="Variance (L)" fill={RED}   radius={[4,4,0,0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-xs text-muted-foreground">No SICPA verification data</div>
              )}
            </div>

            {/* SICPA records list */}
            <div className="bg-card/50 border border-border/40 rounded-2xl p-4">
              <SectionHeader icon={ShieldCheck} title="SICPA Records" subtitle={`${sicpa.length} verifications`} color={GREEN} />
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {sicpa.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No SICPA records found.</p>
                ) : sicpa.map((r: any) => {
                  const flagCfg = FLAG_CFG[r.discrepancyFlag ?? "none"] ?? FLAG_CFG.none;
                  return (
                    <div key={r.id} className="p-2.5 rounded-xl bg-secondary/20 border border-border/20 hover:border-border/40 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{r.verificationRef}</span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5" style={{ borderColor: flagCfg.color, color: flagCfg.color }}>
                          {flagCfg.label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div><span className="text-muted-foreground">Declared: </span><span className="text-foreground font-medium">{fmtL(Number(r.declaredVolumeLitres ?? 0))}</span></div>
                        <div><span className="text-muted-foreground">Verified: </span><span className="text-foreground font-medium">{fmtL(Number(r.verifiedVolumeLitres ?? 0))}</span></div>
                        <div><span className="text-muted-foreground">Variance: </span><span style={{ color: flagCfg.color }} className="font-medium">{Number(r.variancePercent ?? 0).toFixed(1)}%</span></div>
                        <div><span className="text-muted-foreground">Date: </span><span className="text-foreground">{fmtDate(r.verificationDate)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Consignments */}
          <div className="bg-card/50 border border-border/40 rounded-2xl p-4">
            <SectionHeader icon={Activity} title="Consignments" subtitle={`${consignments.length} consignments recorded`} color={PURPLE} />
            {consignments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No consignments recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/20">
                      {["Ref", "Product", "Declared Volume", "Source", "Destination", "Date", "Status"].map(h => (
                        <th key={h} className="text-left text-[10px] text-muted-foreground font-medium pb-2 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {consignments.slice(0, 10).map((c: any) => (
                      <tr key={c.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                        <td className="py-2 pr-4 font-mono text-[10px] text-muted-foreground">{c.consignmentRef}</td>
                        <td className="py-2 pr-4 capitalize">{c.productType}</td>
                        <td className="py-2 pr-4 font-medium">{fmtL(Number(c.declaredVolumeLitres ?? 0))}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{c.sourceTerminal ?? "—"}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{c.destinationDepot ?? "—"}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{fmtDate(c.upliftDate)}</td>
                        <td className="py-2">
                          <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${c.status === "flagged" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-green-500/15 text-green-400 border-green-500/30"}`}>
                            {c.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab: Payments ── */}
        <TabsContent value="payments" className="space-y-4">
          {/* Payment KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Collected",   value: fmtM(kpis.totalPaid),      icon: CheckCircle,   color: GREEN  },
              { label: "Outstanding",       value: fmtM(kpis.outstanding),    icon: Clock,         color: kpis.outstanding > 0 ? RED : GREEN },
              { label: "Payments Made",     value: String(payments.length),   icon: CreditCard,    color: TEAL   },
              { label: "Compliance Rate",   value: `${kpis.complianceRate}%`, icon: ShieldCheck,   color: kpis.complianceRate >= 80 ? GREEN : AMBER },
            ].map(k => <StatCard key={k.label} {...k} />)}
          </div>

          {/* Payment timeline chart */}
          <div className="bg-card/50 border border-border/40 rounded-2xl p-4">
            <SectionHeader icon={TrendingUp} title="Payment History" subtitle="Amounts paid over time" color={GREEN} />
            {paymentTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={paymentTimeline.map((p: any) => ({
                  name: fmtDate(p.paidAt ?? p.createdAt),
                  amount: Number(p.amount ?? 0),
                }))} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="amount" name="Amount (NLE)" fill={GREEN} radius={[4,4,0,0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">No payment history</div>
            )}
          </div>

          {/* Payment table */}
          <div className="bg-card/50 border border-border/40 rounded-2xl p-4">
            <SectionHeader icon={CreditCard} title="Payment Register" subtitle={`${payments.length} payments recorded`} color={TEAL} />
            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No payments recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/20">
                      {["Reference", "Type", "Amount", "Method", "Bank", "Date", "Status"].map(h => (
                        <th key={h} className="text-left text-[10px] text-muted-foreground font-medium pb-2 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => {
                      const st = PAY_STATUS[p.status] ?? PAY_STATUS.pending;
                      return (
                        <tr key={p.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                          <td className="py-2 pr-4 font-mono text-[10px] text-muted-foreground">{p.paymentRef}</td>
                          <td className="py-2 pr-4 capitalize">{(p.paymentType ?? "").replace(/_/g, " ")}</td>
                          <td className="py-2 pr-4 font-semibold text-green-400">{fmt(p.amount)}</td>
                          <td className="py-2 pr-4 capitalize text-muted-foreground">{(p.paymentMethod ?? "—").replace(/_/g, " ")}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{p.bankName ?? "—"}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{fmtDate(p.paidAt)}</td>
                          <td className="py-2">
                            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${st.cls}`}>{st.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab: Penalties ── */}
        <TabsContent value="penalties" className="space-y-4">
          {/* Penalty KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Penalties",    value: fmtM(kpis.totalPenalties),                     icon: AlertTriangle, color: RED    },
              { label: "Penalties Paid",     value: fmtM(kpis.paidPenalties),                      icon: CheckCircle,   color: GREEN  },
              { label: "Outstanding",        value: fmtM(kpis.totalPenalties - kpis.paidPenalties), icon: Clock,         color: AMBER  },
              { label: "Cases",              value: String(penalties.length),                        icon: FileText,      color: PURPLE },
            ].map(k => <StatCard key={k.label} {...k} />)}
          </div>

          {/* Penalty cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {penalties.length === 0 ? (
              <div className="col-span-2 bg-card/50 border border-border/40 rounded-2xl p-6 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: GREEN }} />
                <p className="text-sm font-medium text-foreground">No Penalties</p>
                <p className="text-xs text-muted-foreground mt-1">This OMC has no penalty records.</p>
              </div>
            ) : penalties.map((p: any) => {
              const st = PEN_STATUS[p.status] ?? PEN_STATUS.outstanding;
              const principal = Number(p.principalAmount ?? 0);
              const penalty   = Number(p.penaltyAmount ?? 0);
              const interest  = Number(p.interestAmount ?? 0);
              const total     = Number(p.totalDue ?? 0);
              return (
                <div key={p.id} className="bg-card/50 border border-border/40 rounded-2xl p-4 hover:border-border/70 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{p.penaltyRef}</p>
                      <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{(p.penaltyType ?? "").replace(/_/g, " ")}</p>
                    </div>
                    <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${st.cls}`}>{st.label}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Principal", value: fmt(principal), color: ACCENT },
                      { label: "Penalty",   value: fmt(penalty),   color: RED    },
                      { label: "Interest",  value: fmt(interest),  color: AMBER  },
                    ].map(item => (
                      <div key={item.label} className="p-2 rounded-lg bg-secondary/20 text-center">
                        <p className="text-[9px] text-muted-foreground">{item.label}</p>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: item.color }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Total Due: <span className="text-foreground font-bold">{fmt(total)}</span></span>
                    <span className="text-muted-foreground">Due: {fmtDate(p.dueDate)}</span>
                  </div>
                  {p.reason && <p className="text-[10px] text-muted-foreground mt-2 border-t border-border/20 pt-2">{p.reason}</p>}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Tab: Analytics ── */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Compliance gauge */}
            <div className="bg-card/50 border border-border/40 rounded-2xl p-4">
              <SectionHeader icon={ShieldCheck} title="Compliance Overview" subtitle="Payment compliance rate" color={GREEN} />
              <div className="flex items-center justify-center py-4">
                <div className="relative w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: "Paid",        value: kpis.complianceRate,       fill: GREEN },
                        { name: "Outstanding", value: 100 - kpis.complianceRate, fill: "#1e293b" },
                      ]} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={68} startAngle={90} endAngle={-270} paddingAngle={2}>
                        {[GREEN, "#1e293b"].map((c, i) => <Cell key={i} fill={c} stroke="transparent" />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <p className="text-2xl font-bold" style={{ color: kpis.complianceRate >= 80 ? GREEN : kpis.complianceRate >= 50 ? AMBER : RED }}>
                      {kpis.complianceRate}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Compliance</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { label: "Tax Returns Filed",  value: taxReturns.length,                                                color: TEAL   },
                  { label: "Fully Paid",         value: taxReturns.filter((r: any) => Number(r.totalPaid) >= Number(r.totalTaxDue)).length, color: GREEN  },
                  { label: "Partial Payment",    value: taxReturns.filter((r: any) => Number(r.totalPaid) > 0 && Number(r.totalPaid) < Number(r.totalTaxDue)).length, color: AMBER  },
                  { label: "Unpaid",             value: taxReturns.filter((r: any) => Number(r.totalPaid) === 0).length, color: RED    },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                    <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product split */}
            <div className="bg-card/50 border border-border/40 rounded-2xl p-4">
              <SectionHeader icon={Droplets} title="Volume by Product Type" subtitle="Consignment distribution" color={TEAL} />
              {productSplit.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={productSplit} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" outerRadius={72} innerRadius={40} paddingAngle={3}
                        label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                        {productSplit.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                      </Pie>
                      <Tooltip content={<CT />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {productSplit.map(p => (
                      <div key={p.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                          <span className="capitalize text-muted-foreground">{p.name}</span>
                        </div>
                        <span className="font-semibold text-foreground">{fmtL(p.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">No consignment data</div>
              )}
            </div>

            {/* SICPA discrepancy summary */}
            <div className="bg-card/50 border border-border/40 rounded-2xl p-4">
              <SectionHeader icon={AlertTriangle} title="SICPA Discrepancy Summary" subtitle="Volume variance analysis" color={RED} />
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: "Total Declared",  value: fmtL(kpis.sicpaDeclared), color: TEAL  },
                  { label: "SICPA Verified",  value: fmtL(kpis.sicpaVerified), color: GREEN },
                  { label: "Total Variance",  value: fmtL(Math.abs(kpis.sicpaDeclared - kpis.sicpaVerified)), color: RED },
                  { label: "Verifications",   value: String(sicpa.length),     color: PURPLE },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl bg-secondary/20 border border-border/20">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {Object.entries(FLAG_CFG).map(([flag, cfg]) => {
                  const count = sicpa.filter((r: any) => r.discrepancyFlag === flag).length;
                  return (
                    <div key={flag} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                        <span className="text-muted-foreground">{cfg.label}</span>
                      </div>
                      <span className="font-semibold" style={{ color: cfg.color }}>{count} record{count !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue gap analysis */}
            <div className="bg-card/50 border border-border/40 rounded-2xl p-4">
              <SectionHeader icon={TrendingUp} title="Revenue Gap Analysis" subtitle="Due vs paid breakdown" color={ACCENT} />
              {revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueTrend} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false}
                      tickFormatter={(v: number) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
                    <Tooltip content={<CT />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="paid" name="Paid"        fill={GREEN} radius={[4,4,0,0]} maxBarSize={32} stackId="a" />
                    <Bar dataKey="gap"  name="Outstanding" fill={RED}   radius={[4,4,0,0]} maxBarSize={32} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">No data available</div>
              )}
              <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                <Zap className="w-3 h-3" style={{ color: ACCENT }} />
                Stacked view: green = paid, red = outstanding gap
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
