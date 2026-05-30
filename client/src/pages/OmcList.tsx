import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { Building2, Plus, Search, Filter, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  suspended: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  revoked: "bg-red-500/20 text-red-400 border-red-500/30",
  pending: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function OmcList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ registrationNumber: "", companyName: "", tradingName: "", tinNumber: "", contactPerson: "", contactEmail: "", contactPhone: "", address: "" });

  const { data: omcs, isLoading, refetch } = trpc.omcs.list.useQuery({ search: search || undefined, status: statusFilter });
  const createMutation = trpc.omcs.create.useMutation({
    onSuccess: () => { toast.success("OMC registered successfully"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = omcs ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">OMC Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">Oil Marketing Company registration and master data management</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="fis-gradient text-white border-0 gap-2">
              <Plus className="w-4 h-4" /> Register New OMC
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle>Register New OMC</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {[
                { key: "registrationNumber", label: "Registration Number *", placeholder: "OMC-2026-001" },
                { key: "companyName", label: "Company Name *", placeholder: "Freetown Petroleum Ltd." },
                { key: "tradingName", label: "Trading Name", placeholder: "FPL" },
                { key: "tinNumber", label: "TIN Number", placeholder: "TIN-123456" },
                { key: "contactPerson", label: "Contact Person", placeholder: "John Kamara" },
                { key: "contactEmail", label: "Contact Email", placeholder: "contact@fpl.sl" },
                { key: "contactPhone", label: "Phone", placeholder: "+232 76 000000" },
              ].map((f) => (
                <div key={f.key} className={f.key === "address" ? "col-span-2" : ""}>
                  <Label className="text-xs text-muted-foreground mb-1 block">{f.label}</Label>
                  <Input
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="bg-background border-border text-foreground text-sm"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground mb-1 block">Address</Label>
                <Input
                  placeholder="123 Siaka Stevens Street, Freetown"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  className="bg-background border-border text-foreground text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancel</Button>
              <Button
                className="fis-gradient text-white border-0"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate(form as any)}
              >
                {createMutation.isPending ? "Registering..." : "Register OMC"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total OMCs", value: filtered.length, color: "text-foreground" },
          { label: "Active", value: filtered.filter((o) => o.status === "active").length, color: "text-green-400" },
          { label: "Suspended", value: filtered.filter((o) => o.status === "suspended").length, color: "text-yellow-400" },
          { label: "Pending", value: filtered.filter((o) => o.status === "pending").length, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="fis-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or registration number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border text-foreground"
          />
        </div>
        <Select value={statusFilter ?? "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-40 bg-card border-border text-foreground">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="fis-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {["Reg. Number", "Company Name", "TIN", "Contact", "Depots", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading OMCs...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No OMCs found. Register the first OMC to get started.
              </td></tr>
            ) : filtered.map((omc) => (
              <tr key={omc.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{omc.registrationNumber}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{omc.companyName}</p>
                  {omc.tradingName && <p className="text-xs text-muted-foreground">{omc.tradingName}</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{omc.tinNumber ?? "—"}</td>
                <td className="px-4 py-3">
                  <p className="text-foreground text-xs">{omc.contactPerson ?? "—"}</p>
                  <p className="text-muted-foreground text-xs">{omc.contactEmail ?? ""}</p>
                </td>
                <td className="px-4 py-3 text-center text-foreground">{omc.depotCount ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded border font-medium ${STATUS_COLORS[omc.status] ?? ""}`}>
                    {omc.status.charAt(0).toUpperCase() + omc.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/omcs/${omc.id}`}>
                    <span className="text-primary hover:underline text-xs flex items-center gap-1 cursor-pointer">
                      View <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
