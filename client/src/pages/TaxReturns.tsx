import { trpc } from "@/lib/trpc";
import { useState, useCallback } from "react";
import { FileText, Plus, Send, Calculator, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Constants ───────────────────────────────────────────────────────────────
const LEVY_RATE_NLE = 5; // 5 NLE per litre declared

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground border-border",
  submitted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  under_review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  assessed: "bg-green-500/20 text-green-400 border-green-500/30",
  overdue: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ─── Auto-calculation helper ──────────────────────────────────────────────────
function calcAmount(volumeStr: string): number {
  const vol = parseFloat(volumeStr.replace(/,/g, ""));
  if (isNaN(vol) || vol <= 0) return 0;
  return vol * LEVY_RATE_NLE;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type FormState = {
  omcId: string;
  periodYear: string;
  periodQuarter: string;
  exciseDeclaredVolume: string;
  vatDeclaredVolume: string;
  levyDeclaredVolume: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  omcId: "", periodYear: "2026", periodQuarter: "1",
  exciseDeclaredVolume: "", vatDeclaredVolume: "", levyDeclaredVolume: "",
  notes: "",
};

// ─── Derived totals ───────────────────────────────────────────────────────────
function useDerivedTotals(form: FormState) {
  const exciseAmount = calcAmount(form.exciseDeclaredVolume);
  const vatAmount = calcAmount(form.vatDeclaredVolume);
  const levyAmount = calcAmount(form.levyDeclaredVolume);

  const exciseVol = parseFloat(form.exciseDeclaredVolume.replace(/,/g, "")) || 0;
  const vatVol = parseFloat(form.vatDeclaredVolume.replace(/,/g, "")) || 0;
  const levyVol = parseFloat(form.levyDeclaredVolume.replace(/,/g, "")) || 0;

  const totalVolume = exciseVol + vatVol + levyVol;
  const totalTaxDue = exciseAmount + vatAmount + levyAmount;

  return { exciseAmount, vatAmount, levyAmount, totalVolume, totalTaxDue };
}

// ─── Volume Input with live preview ──────────────────────────────────────────
function VolumeRow({
  label, volumeKey, amount, form, onChange,
}: {
  label: string;
  volumeKey: keyof FormState;
  amount: number;
  form: FormState;
  onChange: (key: keyof FormState, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 items-end">
      <div className="col-span-2">
        <Label className="text-xs text-muted-foreground mb-1 block">Declared Volume (L)</Label>
        <Input
          type="number"
          min="0"
          placeholder="e.g. 50000"
          value={form[volumeKey]}
          onChange={(e) => onChange(volumeKey, e.target.value)}
          className="bg-background border-border text-foreground text-sm"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
          <Calculator className="w-3 h-3 text-primary" /> Amount (NLE)
        </Label>
        <div className={`h-9 px-3 flex items-center rounded-md border text-sm font-semibold transition-all duration-200 ${
          amount > 0
            ? "bg-primary/10 border-primary/40 text-primary"
            : "bg-background border-border text-muted-foreground"
        }`}>
          {amount > 0 ? `NLE ${fmt(amount)}` : "—"}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TaxReturns() {
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { exciseAmount, vatAmount, levyAmount, totalVolume, totalTaxDue } = useDerivedTotals(form);

  const { data: returns, isLoading, refetch } = trpc.taxReturns.list.useQuery({ status: statusFilter });
  const { data: omcs } = trpc.omcs.list.useQuery();

  const createMutation = trpc.taxReturns.create.useMutation({
    onSuccess: () => {
      toast.success("Tax return created successfully");
      setOpen(false);
      setForm(EMPTY_FORM);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const submitMutation = trpc.taxReturns.submit.useMutation({
    onSuccess: () => { toast.success("Return submitted successfully"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleChange = useCallback((key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmitForm = () => {
    if (!form.omcId) { toast.error("Please select an OMC"); return; }
    createMutation.mutate({
      omcId: Number(form.omcId),
      periodYear: Number(form.periodYear),
      periodQuarter: Number(form.periodQuarter),
      exciseDeclaredVolume: form.exciseDeclaredVolume || "0",
      exciseDutyRate: String(LEVY_RATE_NLE),
      exciseDutyAmount: String(exciseAmount),
      vatDeclaredVolume: form.vatDeclaredVolume || "0",
      vatRate: String(LEVY_RATE_NLE),
      vatAmount: String(vatAmount),
      levyDeclaredVolume: form.levyDeclaredVolume || "0",
      levyRate: String(LEVY_RATE_NLE),
      levyAmount: String(levyAmount),
      totalDeclaredVolume: String(totalVolume),
      totalTaxDue: String(totalTaxDue),
      notes: form.notes,
    } as any);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Returns & Filing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quarterly tax return filing — Excise Duty, VAT, and Petroleum Levy
            <span className="ml-2 text-primary font-medium">@ NLE {LEVY_RATE_NLE}/litre</span>
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(EMPTY_FORM); }}>
          <DialogTrigger asChild>
            <Button className="fis-gradient text-white border-0 gap-2">
              <Plus className="w-4 h-4" /> New Return
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                File New Tax Return
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* OMC + Period */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">OMC *</Label>
                  <Select value={form.omcId} onValueChange={(v) => handleChange("omcId", v)}>
                    <SelectTrigger className="bg-background border-border text-foreground text-sm">
                      <SelectValue placeholder="Select OMC" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {(omcs ?? []).map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>{o.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Year *</Label>
                  <Input
                    value={form.periodYear}
                    onChange={(e) => handleChange("periodYear", e.target.value)}
                    className="bg-background border-border text-foreground text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Quarter *</Label>
                  <Select value={form.periodQuarter} onValueChange={(v) => handleChange("periodQuarter", v)}>
                    <SelectTrigger className="bg-background border-border text-foreground text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {[1, 2, 3, 4].map((q) => <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rate notice */}
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg">
                <Calculator className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-primary">
                  Amounts are automatically calculated at <strong>NLE {LEVY_RATE_NLE} per litre</strong> declared. Enter volumes below.
                </p>
              </div>

              {/* Excise Duty */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Excise Duty</h4>
                <VolumeRow label="Excise Duty" volumeKey="exciseDeclaredVolume" amount={exciseAmount} form={form} onChange={handleChange} />
              </div>

              {/* VAT */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">VAT</h4>
                <VolumeRow label="VAT" volumeKey="vatDeclaredVolume" amount={vatAmount} form={form} onChange={handleChange} />
              </div>

              {/* Petroleum Levy */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Petroleum Levy</h4>
                <VolumeRow label="Petroleum Levy" volumeKey="levyDeclaredVolume" amount={levyAmount} form={form} onChange={handleChange} />
              </div>

              {/* Totals summary */}
              <div className={`rounded-lg p-4 border transition-all duration-300 ${
                totalTaxDue > 0
                  ? "bg-primary/10 border-primary/40"
                  : "bg-secondary/20 border-border"
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Summary</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Declared Volume</p>
                    <p className="text-lg font-bold text-foreground">
                      {totalVolume > 0 ? `${totalVolume.toLocaleString()} L` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Tax Due</p>
                    <p className={`text-lg font-bold ${totalTaxDue > 0 ? "text-primary" : "text-foreground"}`}>
                      {totalTaxDue > 0 ? `NLE ${fmt(totalTaxDue)}` : "—"}
                    </p>
                  </div>
                </div>
                {totalTaxDue > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Calculation: {totalVolume.toLocaleString()} L × NLE {LEVY_RATE_NLE} = NLE {fmt(totalTaxDue)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
              <Button
                className="fis-gradient text-white border-0"
                disabled={createMutation.isPending || !form.omcId}
                onClick={handleSubmitForm}
              >
                {createMutation.isPending ? "Saving..." : "Save Return"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter ?? "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-44 bg-card border-border text-foreground">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="assessed">Assessed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="fis-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {["OMC", "Period", "Total Volume (L)", "Tax Due (NLE)", "Paid (NLE)", "Status", "Submitted", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading returns...</td></tr>
            ) : (returns ?? []).length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No tax returns found.
              </td></tr>
            ) : (returns ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{r.companyName ?? `OMC #${r.omcId}`}</td>
                <td className="px-4 py-3 text-muted-foreground">Q{r.periodQuarter} {r.periodYear}</td>
                <td className="px-4 py-3 text-foreground">
                  {r.totalDeclaredVolume ? Number(r.totalDeclaredVolume).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 font-semibold text-primary">
                  {r.totalTaxDue ? `NLE ${Number(r.totalTaxDue).toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {r.totalPaid ? `NLE ${Number(r.totalPaid).toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded border font-medium ${STATUS_COLORS[r.status] ?? ""}`}>
                    {r.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  {r.status === "draft" && (
                    <Button size="sm" variant="outline" className="text-xs border-primary text-primary h-7 gap-1"
                      onClick={() => submitMutation.mutate({ id: r.id })}>
                      <Send className="w-3 h-3" /> Submit
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
