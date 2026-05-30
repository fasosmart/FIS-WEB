import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  CreditCard, Plus, FileText, CheckCircle, Clock, XCircle,
  RefreshCw, Eye, ExternalLink, AlertTriangle, Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: string | number | null | undefined) =>
  v !== null && v !== undefined
    ? `NLE ${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// ─── Status configs ───────────────────────────────────────────────────────────
const PAY_STATUS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  completed:  { label: "Completed",  cls: "bg-green-500/15 text-green-400 border-green-500/30",  icon: <CheckCircle className="w-3 h-3" /> },
  pending:    { label: "Pending",    cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
  processing: { label: "Processing", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",     icon: <RefreshCw className="w-3 h-3" /> },
  failed:     { label: "Failed",     cls: "bg-red-500/15 text-red-400 border-red-500/30",         icon: <XCircle className="w-3 h-3" /> },
  reversed:   { label: "Reversed",   cls: "bg-gray-500/15 text-gray-400 border-gray-500/30",     icon: <RefreshCw className="w-3 h-3" /> },
};

const PEN_STATUS: Record<string, { label: string; cls: string }> = {
  outstanding: { label: "Outstanding", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  partial:     { label: "Partial",     cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  paid:        { label: "Paid",        cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  waived:      { label: "Waived",      cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  appealed:    { label: "Appealed",    cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

const PAY_TYPE_LABELS: Record<string, string> = {
  excise_duty: "Excise Duty", vat: "VAT", petroleum_levy: "Petroleum Levy",
  penalty: "Penalty", interest: "Interest", other: "Other",
};

const PEN_TYPE_LABELS: Record<string, string> = {
  late_filing: "Late Filing", underpayment: "Underpayment", non_compliance: "Non-Compliance",
  fraud: "Fraud", interest: "Interest", other: "Other",
};

// ─── PDF Viewer Modal ─────────────────────────────────────────────────────────
function PdfViewerModal({ url, fileName, open, onClose }: { url: string; fileName: string; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border text-foreground max-w-4xl w-full h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <DialogTitle className="text-sm font-semibold">{fileName}</DialogTitle>
            </div>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
            </a>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-[#0d0d1a]">
          <iframe
            src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title={fileName}
          />
        </div>
        <div className="px-5 py-3 border-t border-border flex justify-between items-center flex-shrink-0">
          <p className="text-xs text-muted-foreground">Proof of payment document — NRA Sierra Leone</p>
          <a href={url} download={fileName}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payment Detail Modal ─────────────────────────────────────────────────────
function PaymentDetailModal({ paymentId, open, onClose }: { paymentId: number | null; open: boolean; onClose: () => void }) {
  const [pdfOpen, setPdfOpen] = useState(false);
  const { data: p, refetch } = trpc.payments.byId.useQuery(
    { id: paymentId! },
    { enabled: !!paymentId }
  );
  const verifyMutation = trpc.payments.verify.useMutation({
    onSuccess: () => { toast.success("Payment verified and marked as completed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (!p) return null;
  const st = PAY_STATUS[p.status] ?? PAY_STATUS.pending;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg fis-gradient flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-mono">{p.paymentRef}</DialogTitle>
                <p className="text-sm text-muted-foreground">{p.companyName ?? `OMC #${p.omcId}`}</p>
              </div>
              <span className={`ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${st.cls}`}>
                {st.icon} {st.label}
              </span>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Amount highlight */}
            <div className="fis-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Payment Amount</p>
              <p className="text-3xl font-bold text-primary">{fmt(p.amount)}</p>
              <p className="text-xs text-muted-foreground mt-1">{PAY_TYPE_LABELS[p.paymentType] ?? p.paymentType} · {p.currency}</p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Payment Method", value: p.paymentMethod?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "—" },
                { label: "Bank / Institution", value: p.bankName ?? "—" },
                { label: "Bank Reference", value: p.bankRef ?? "—" },
                { label: "Tax Return Ref", value: p.taxReturnId ? `TR-${p.taxReturnId}` : "—" },
                { label: "Paid At", value: fmtDateTime(p.paidAt) },
                { label: "Verified At", value: fmtDateTime(p.verifiedAt) },
                { label: "Created At", value: fmtDateTime(p.createdAt) },
                { label: "Last Updated", value: fmtDateTime((p as any).updatedAt) },
              ].map((r) => (
                <div key={r.label} className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{r.label}</p>
                  <p className="font-medium text-foreground text-xs">{r.value}</p>
                </div>
              ))}
            </div>

            {p.notes && (
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground">{p.notes}</p>
              </div>
            )}

            <Separator className="bg-border" />

            {/* Proof of payment */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Proof of Payment</p>
              {p.proofFileUrl ? (
                <div className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                  <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.proofFileName ?? "proof_document.pdf"}</p>
                    <p className="text-xs text-muted-foreground">PDF Document</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
                    onClick={() => setPdfOpen(true)}>
                    <Eye className="w-3.5 h-3.5" /> View PDF
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-secondary/20 rounded-lg p-3 border border-dashed border-border">
                  <FileText className="w-6 h-6 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No proof of payment uploaded yet</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {p.status === "processing" && (
              <div className="flex justify-end gap-2">
                <Button className="fis-gradient text-white border-0 gap-2" size="sm"
                  disabled={verifyMutation.isPending}
                  onClick={() => verifyMutation.mutate({ id: p.id })}>
                  <CheckCircle className="w-4 h-4" />
                  {verifyMutation.isPending ? "Verifying..." : "Verify & Complete"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {p.proofFileUrl && (
        <PdfViewerModal
          url={p.proofFileUrl}
          fileName={p.proofFileName ?? "proof_document.pdf"}
          open={pdfOpen}
          onClose={() => setPdfOpen(false)}
        />
      )}
    </>
  );
}

// ─── Penalty Detail Modal ─────────────────────────────────────────────────────
function PenaltyDetailModal({ penaltyId, open, onClose }: { penaltyId: number | null; open: boolean; onClose: () => void }) {
  const { data: pen, refetch } = trpc.penalties.byId.useQuery(
    { id: penaltyId! },
    { enabled: !!penaltyId }
  );
  const updateMutation = trpc.penalties.updateStatus.useMutation({
    onSuccess: () => { toast.success("Penalty status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (!pen) return null;
  const st = PEN_STATUS[pen.status] ?? PEN_STATUS.outstanding;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border text-foreground max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold font-mono">{pen.penaltyRef}</DialogTitle>
              <p className="text-sm text-muted-foreground">{PEN_TYPE_LABELS[pen.penaltyType] ?? pen.penaltyType}</p>
            </div>
            <span className={`ml-auto text-xs px-2.5 py-1 rounded-full border font-medium ${st.cls}`}>{st.label}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Amount breakdown */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Principal Amount", value: fmt(pen.principalAmount), color: "text-foreground" },
              { label: "Penalty Amount", value: fmt(pen.penaltyAmount), color: "text-red-400" },
              { label: "Interest Accrued", value: fmt(pen.interestAmount), color: "text-orange-400" },
            ].map((r) => (
              <div key={r.label} className="fis-card p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
                <p className={`text-base font-bold ${r.color}`}>{r.value}</p>
              </div>
            ))}
          </div>

          <div className="fis-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Due</p>
            <p className="text-2xl font-bold text-red-400">{fmt(pen.totalDue)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Due Date", value: fmtDate(pen.dueDate) },
              { label: "Paid Date", value: fmtDate(pen.paidDate) },
              { label: "Enforcement Case", value: pen.enforcementCaseId ? `ENF #${pen.enforcementCaseId}` : "—" },
              { label: "Tax Return", value: pen.taxReturnId ? `TR-${pen.taxReturnId}` : "—" },
              { label: "Issued On", value: fmtDate(pen.createdAt) },
            ].map((r) => (
              <div key={r.label} className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">{r.label}</p>
                <p className="font-medium text-foreground text-xs">{r.value}</p>
              </div>
            ))}
          </div>

          {pen.reason && (
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Reason / Legal Basis</p>
              <p className="text-sm text-foreground">{pen.reason}</p>
            </div>
          )}

          {/* Quick status actions */}
          {pen.status === "outstanding" && (
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: pen.id, status: "appealed" })}>
                Mark as Appealed
              </Button>
              <Button size="sm" className="fis-gradient text-white border-0"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: pen.id, status: "paid" })}>
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Mark as Paid
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Payment Form ─────────────────────────────────────────────────────────
function NewPaymentDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    paymentRef: "", omcId: "", taxReturnId: "", paymentType: "excise_duty" as const,
    amount: "", paymentMethod: "bank_transfer" as const, bankName: "", bankRef: "", notes: "", paidAt: "",
  });
  const { data: omcs } = trpc.omcs.list.useQuery();
  const createMutation = trpc.payments.create.useMutation({
    onSuccess: () => { toast.success("Payment recorded successfully"); setOpen(false); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fis-gradient text-white border-0 gap-2"><Plus className="w-4 h-4" /> Record Payment</Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader><DialogTitle>Record New Payment</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {[
            { key: "paymentRef", label: "Payment Reference *", placeholder: "PAY-2026-009" },
            { key: "amount", label: "Amount (NLE) *", placeholder: "500000" },
            { key: "bankName", label: "Bank / Institution", placeholder: "SLCB" },
            { key: "bankRef", label: "Bank Reference", placeholder: "SLCB-TXN-00123" },
            { key: "paidAt", label: "Payment Date", placeholder: "", type: "date" },
            { key: "notes", label: "Notes", placeholder: "Optional notes" },
          ].map((f) => (
            <div key={f.key}>
              <Label className="text-xs text-muted-foreground mb-1 block">{f.label}</Label>
              <Input type={f.type ?? "text"} placeholder={f.placeholder} value={(form as any)[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="bg-background border-border text-foreground text-sm" />
            </div>
          ))}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">OMC *</Label>
            <Select value={form.omcId} onValueChange={(v) => set("omcId", v)}>
              <SelectTrigger className="bg-background border-border text-foreground text-sm"><SelectValue placeholder="Select OMC" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(omcs ?? []).map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.companyName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Payment Type *</Label>
            <Select value={form.paymentType} onValueChange={(v) => set("paymentType", v)}>
              <SelectTrigger className="bg-background border-border text-foreground text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {Object.entries(PAY_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Payment Method</Label>
            <Select value={form.paymentMethod} onValueChange={(v) => set("paymentMethod", v)}>
              <SelectTrigger className="bg-background border-border text-foreground text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {[["bank_transfer","Bank Transfer"],["cheque","Cheque"],["cash","Cash"],["mobile_money","Mobile Money"],["online","Online"]].map(([k,v]) =>
                  <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
          <Button className="fis-gradient text-white border-0" disabled={createMutation.isPending}
            onClick={() => createMutation.mutate({ ...form, omcId: Number(form.omcId), taxReturnId: form.taxReturnId ? Number(form.taxReturnId) : undefined } as any)}>
            {createMutation.isPending ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Payments() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [penStatusFilter, setPenStatusFilter] = useState<string | undefined>();
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [selectedPenaltyId, setSelectedPenaltyId] = useState<number | null>(null);

  const { data: paymentList, isLoading: payLoading, refetch: refetchPay } =
    trpc.payments.list.useQuery({ status: statusFilter, paymentType: typeFilter });
  const { data: penaltyList, isLoading: penLoading, refetch: refetchPen } =
    trpc.penalties.list.useQuery({ status: penStatusFilter });

  // Summary stats
  const totalCollected = (paymentList ?? []).reduce((s: number, p) => p.status === "completed" ? s + Number(p.amount) : s, 0);
  const totalPending = (paymentList ?? []).reduce((s: number, p) => (p.status === "pending" || p.status === "processing") ? s + Number(p.amount) : s, 0);
  const totalPenalties = (penaltyList ?? []).reduce((s: number, p) => (p.status === "outstanding" || p.status === "partial") ? s + Number(p.totalDue) : s, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">Payment records, proof of payment documents, and penalty register</p>
        </div>
        <NewPaymentDialog onSuccess={refetchPay} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Collected (Filtered)", value: fmt(totalCollected), color: "text-green-400", icon: <CheckCircle className="w-5 h-5 text-green-400" /> },
          { label: "Pending / Processing", value: fmt(totalPending), color: "text-yellow-400", icon: <Clock className="w-5 h-5 text-yellow-400" /> },
          { label: "Outstanding Penalties", value: fmt(totalPenalties), color: "text-red-400", icon: <AlertTriangle className="w-5 h-5 text-red-400" /> },
        ].map((s) => (
          <div key={s.label} className="fis-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">{s.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments">
        <TabsList className="bg-secondary/50 border border-border">
          <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <CreditCard className="w-4 h-4 mr-2" /> Payments ({(paymentList ?? []).length})
          </TabsTrigger>
          <TabsTrigger value="penalties" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <AlertTriangle className="w-4 h-4 mr-2" /> Penalties ({(penaltyList ?? []).length})
          </TabsTrigger>
        </TabsList>

        {/* ── Payments Tab ── */}
        <TabsContent value="payments" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={statusFilter ?? "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-44 bg-card border-border text-foreground text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(PAY_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter ?? "all"} onValueChange={(v) => setTypeFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-48 bg-card border-border text-foreground text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(PAY_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="fis-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  {["Reference", "OMC", "Type", "Amount", "Method", "Paid At", "Status", "Proof"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payLoading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading payments...</td></tr>
                ) : (paymentList ?? []).length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No payments found</p>
                  </td></tr>
                ) : (paymentList ?? []).map((p: NonNullable<typeof paymentList>[number]) => {
                  const st = PAY_STATUS[p.status] ?? PAY_STATUS.pending;
                  return (
                    <tr key={p.id}
                      className="hover:bg-secondary/20 transition-colors cursor-pointer group"
                      onClick={() => setSelectedPaymentId(p.id)}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-primary group-hover:underline">{p.paymentRef}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground text-xs">{p.companyName ?? `OMC #${p.omcId}`}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{PAY_TYPE_LABELS[p.paymentType] ?? p.paymentType}</td>
                      <td className="px-4 py-3 font-bold text-foreground">{fmt(p.amount)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{p.paymentMethod?.replace("_", " ") ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(p.paidAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 w-fit text-xs px-2 py-1 rounded-full border font-medium ${st.cls}`}>
                          {st.icon} {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {p.proofFileUrl ? (
                          <button
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                            onClick={() => setSelectedPaymentId(p.id)}>
                            <FileText className="w-3.5 h-3.5" /> View PDF
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Penalties Tab ── */}
        <TabsContent value="penalties" className="space-y-4 mt-4">
          {/* Filter */}
          <div className="flex gap-3">
            <Select value={penStatusFilter ?? "all"} onValueChange={(v) => setPenStatusFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-44 bg-card border-border text-foreground text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(PEN_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="fis-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  {["Reference", "OMC", "Type", "Principal", "Penalty", "Interest", "Total Due", "Due Date", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {penLoading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading penalties...</td></tr>
                ) : (penaltyList ?? []).length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No penalties found</p>
                  </td></tr>
                ) : (penaltyList ?? []).map((pen: NonNullable<typeof penaltyList>[number]) => {
                  const st = PEN_STATUS[pen.status] ?? PEN_STATUS.outstanding;
                  const isOverdue = pen.dueDate && new Date(pen.dueDate) < new Date() && pen.status === "outstanding";
                  return (
                    <tr key={pen.id}
                      className="hover:bg-secondary/20 transition-colors cursor-pointer group"
                      onClick={() => setSelectedPenaltyId(pen.id)}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-red-400 group-hover:underline">{pen.penaltyRef}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground text-xs">{pen.companyName ?? `OMC #${pen.omcId}`}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{PEN_TYPE_LABELS[pen.penaltyType] ?? pen.penaltyType}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{fmt(pen.principalAmount)}</td>
                      <td className="px-4 py-3 text-xs text-red-400 font-medium">{fmt(pen.penaltyAmount)}</td>
                      <td className="px-4 py-3 text-xs text-orange-400">{fmt(pen.interestAmount)}</td>
                      <td className="px-4 py-3 font-bold text-red-400">{fmt(pen.totalDue)}</td>
                      <td className={`px-4 py-3 text-xs ${isOverdue ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
                        {fmtDate(pen.dueDate)}{isOverdue && " ⚠"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Modals */}
      <PaymentDetailModal
        paymentId={selectedPaymentId}
        open={!!selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
      />
      <PenaltyDetailModal
        penaltyId={selectedPenaltyId}
        open={!!selectedPenaltyId}
        onClose={() => setSelectedPenaltyId(null)}
      />
    </div>
  );
}
