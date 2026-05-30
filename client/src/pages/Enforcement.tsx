import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Gavel, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  under_review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  notice_issued: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  escalated: "bg-red-500/20 text-red-400 border-red-500/30",
  closed: "bg-secondary text-muted-foreground border-border",
};

const CASE_TYPE_COLORS: Record<string, string> = {
  assessment: "text-blue-400",
  penalty: "text-orange-400",
  fraud: "text-red-400",
  audit: "text-purple-400",
  appeal: "text-yellow-400",
};

export default function Enforcement() {
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [form, setForm] = useState({
    omcId: "",     caseType: "default_assessment" as const,
    assessedAmount: "", penaltyAmount: "", interestAmount: "",
    description: "", dueDate: "",
  });

  const { data: cases, isLoading, refetch } = trpc.enforcement.list.useQuery({ status: statusFilter });
  const { data: omcs } = trpc.omcs.list.useQuery();
  const createMutation = trpc.enforcement.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Enforcement case ${data.caseRef} created`);
      setOpen(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const issueNoticeMutation = trpc.enforcement.issueNotice.useMutation({
    onSuccess: () => { toast.success("Notice issued"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const resolveStatusMutation = trpc.enforcement.updateStatus.useMutation({
    onSuccess: () => { toast.success("Case updated"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const totalAssessed = (cases ?? []).reduce((sum, c) => sum + Number(c.assessedAmount ?? 0), 0);
  const totalPenalties = (cases ?? []).reduce((sum, c) => sum + Number(c.penaltyAmount ?? 0), 0);
  const openCases = (cases ?? []).filter((c) => c.status === "open" || c.status === "under_review" || c.status === "notice_issued").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enforcement</h1>
          <p className="text-sm text-muted-foreground mt-1">Statutory assessment notices, penalty generation, and case management queue</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="fis-gradient text-white border-0 gap-2"><Plus className="w-4 h-4" /> New Enforcement Case</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-lg">
            <DialogHeader><DialogTitle>Create Enforcement Case</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
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
                  <Label className="text-xs text-muted-foreground mb-1 block">Case Type *</Label>
                  <Select value={form.caseType} onValueChange={(v) => setForm((p) => ({ ...p, caseType: v as any }))}>
                    <SelectTrigger className="bg-background border-border text-foreground text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["default_assessment", "additional_assessment", "penalty", "interest"].map((t) => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "assessedAmount", label: "Assessed Amount (SLL)" },
                  { key: "penaltyAmount", label: "Penalty Amount (SLL)" },
                  { key: "interestAmount", label: "Interest Amount (SLL)" },
                ].map((f) => (
                  <div key={f.key}>
                    <Label className="text-xs text-muted-foreground mb-1 block">{f.label}</Label>
                    <Input value={(form as any)[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder="0.00" className="bg-background border-border text-foreground text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="bg-background border-border text-foreground text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the enforcement action..." className="bg-background border-border text-foreground text-sm" />
              </div>
              {form.assessedAmount && form.penaltyAmount && (
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <p className="text-xs text-muted-foreground">Total Due</p>
                  <p className="text-lg font-bold text-foreground">
                    ${(Number(form.assessedAmount) + Number(form.penaltyAmount) + Number(form.interestAmount)).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
              <Button className="fis-gradient text-white border-0" disabled={createMutation.isPending}
                onClick={() => createMutation.mutate({ ...form, omcId: Number(form.omcId) } as any)}>
                {createMutation.isPending ? "Creating..." : "Create Case"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Open Cases", value: openCases, color: "text-blue-400" },
          { label: "Total Assessed", value: `$${(totalAssessed / 1000000).toFixed(1)}M`, color: "text-foreground" },
          { label: "Total Penalties", value: `$${(totalPenalties / 1000).toFixed(0)}K`, color: "text-orange-400" },
          { label: "Resolved", value: (cases ?? []).filter((c) => c.status === "resolved").length, color: "text-green-400" },
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
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="notice_issued">Notice Issued</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="fis-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {["Case Ref", "OMC", "Type", "Assessed", "Penalty", "Interest", "Total Due", "Status", "Due Date", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Loading enforcement cases...</td></tr>
            ) : (cases ?? []).length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                <Gavel className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No enforcement cases found.
              </td></tr>
            ) : (cases ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.caseRef}</td>
                <td className="px-4 py-3 font-medium text-foreground">{c.companyName ?? `OMC #${c.omcId}`}</td>
                <td className={`px-4 py-3 text-xs font-medium uppercase ${CASE_TYPE_COLORS[c.caseType] ?? ""}`}>{c.caseType}</td>
                <td className="px-4 py-3 text-foreground text-xs">{c.assessedAmount ? `$${Number(c.assessedAmount).toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3 text-orange-400 text-xs">{c.penaltyAmount ? `$${Number(c.penaltyAmount).toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3 text-yellow-400 text-xs">{c.interestAmount ? `$${Number(c.interestAmount).toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3 font-bold text-foreground text-xs">{c.totalDue ? `$${Number(c.totalDue).toLocaleString()}` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded border font-medium ${STATUS_COLORS[c.status] ?? ""}`}>
                    {c.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">
                  {c.status === "open" && (
                    <Button size="sm" variant="outline" className="text-xs border-orange-500/30 text-orange-400 h-7"
                      onClick={() => issueNoticeMutation.mutate({ id: c.id })}>
                      Issue Notice
                    </Button>
                  )}
                  {c.status === "notice_issued" && (
                    <Button size="sm" variant="outline" className="text-xs border-green-500/30 text-green-400 h-7"
                      onClick={() => resolveStatusMutation.mutate({ id: c.id, status: "resolved" })}>
                      Resolve
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
