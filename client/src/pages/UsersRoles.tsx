import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users, Search, Shield, UserCog, Building2, User,
  Trash2, Edit2, Clock, Mail, Calendar, ChevronDown,
} from "lucide-react";

type UserRole = "user" | "admin" | "nra_admin" | "tax_officer" | "omc_user";

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; icon: React.ElementType; description: string }> = {
  admin:       { label: "Admin",          color: "#e91e8c", bg: "#e91e8c18", icon: Shield,   description: "Full system access" },
  nra_admin:   { label: "NRA Admin",      color: "#e91e8c", bg: "#e91e8c18", icon: Shield,   description: "Full NRA platform access" },
  tax_officer: { label: "Tax Officer",    color: "#06b6d4", bg: "#06b6d418", icon: UserCog,  description: "Returns, SICPA, Enforcement" },
  omc_user:    { label: "OMC Portal",     color: "#8b5cf6", bg: "#8b5cf618", icon: Building2, description: "OMC portal access only" },
  user:        { label: "User",           color: "#64748b", bg: "#64748b18", icon: User,     description: "Basic read-only access" },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.user;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <cfg.icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function UserDetailModal({ user, onClose, onRoleChange }: {
  user: any; onClose: () => void;
  onRoleChange: (userId: number, role: UserRole) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role as UserRole);
  const [saving, setSaving] = useState(false);
  const updateRole = trpc.userManagement.updateRole.useMutation({
    onSuccess: () => {
      toast.success(`Role updated to ${ROLE_CONFIG[selectedRole]?.label}`);
      onRoleChange(user.id, selectedRole);
      onClose();
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setSaving(false),
  });

  const handleSave = () => {
    if (selectedRole === user.role) { onClose(); return; }
    setSaving(true);
    updateRole.mutate({ userId: user.id, role: selectedRole });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "#e91e8c22", color: "#e91e8c" }}>
              {(user.name || user.email || "?")[0].toUpperCase()}
            </div>
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User Info */}
          <div className="bg-secondary/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{user.name || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{user.email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Last sign-in: {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString() : "Never"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Created: {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground font-mono text-xs">{user.openId}</span>
            </div>
          </div>

          {/* Role Assignment */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Assign Role
            </label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
              <SelectTrigger className="bg-secondary/20 border-border/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <cfg.icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                      <div>
                        <span className="font-medium">{cfg.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">— {cfg.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role description */}
          <div className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3">
            <span className="font-semibold" style={{ color: ROLE_CONFIG[selectedRole]?.color }}>
              {ROLE_CONFIG[selectedRole]?.label}
            </span>
            {" — "}{ROLE_CONFIG[selectedRole]?.description}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-border/40">Cancel</Button>
          <Button onClick={handleSave} disabled={saving}
            style={{ background: "#e91e8c" }} className="text-white hover:opacity-90">
            {saving ? "Saving..." : "Save Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersRoles() {
  const { user: currentUser } = useAuth();
  const utils = trpc.useUtils();
  const { data: userList = [], isLoading } = trpc.userManagement.list.useQuery();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const deleteUser = trpc.userManagement.delete.useMutation({
    onSuccess: () => {
      toast.success("User removed successfully");
      utils.userManagement.list.invalidate();
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleRoleChange = () => {
    utils.userManagement.list.invalidate();
  };

  const filtered = (userList as any[]).filter((u: any) => {
    const matchSearch = !search ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = (userList as any[]).reduce((acc: Record<string, number>, u: any) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users & Roles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage platform users and access permissions</p>
        </div>
        <Badge variant="outline" className="text-xs border-border/40">
          {(userList as any[]).length} total users
        </Badge>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([key, cfg]) => (
          <button key={key}
            onClick={() => setRoleFilter(roleFilter === key ? "all" : key)}
            className={`rounded-xl p-3 border text-left transition-all duration-150 ${roleFilter === key ? "border-opacity-80" : "border-border/30 hover:border-border/60"}`}
            style={roleFilter === key ? { background: cfg.bg, borderColor: cfg.color } : { background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2 mb-1">
              <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
              <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{roleCounts[key] ?? 0}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{cfg.description}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9 bg-secondary/20 border-border/40 text-sm h-9" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
          <SelectTrigger className="w-40 h-9 bg-secondary/20 border-border/40 text-sm">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="bg-card/50 border border-border/40 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Login Method</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Sign-in</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-xs">Loading users...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-xs">No users found</td></tr>
            ) : filtered.map((u: any) => (
              <tr key={u.id}
                onClick={() => setSelectedUser(u)}
                className="border-b border-border/20 last:border-0 hover:bg-secondary/20 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: ROLE_CONFIG[u.role as UserRole]?.bg ?? "#64748b18", color: ROLE_CONFIG[u.role as UserRole]?.color ?? "#64748b" }}>
                      {(u.name || u.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{u.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email || u.openId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><RoleBadge role={u.role as UserRole} /></td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground capitalize">{u.loginMethod || "oauth"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">
                    {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "Never"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedUser(u)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    {u.id !== currentUser?.id && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                        onClick={() => setDeleteTarget(u)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onRoleChange={handleRoleChange} />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <AlertDialog open onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent className="bg-card border-border/60">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{deleteTarget.name || deleteTarget.email}</strong>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteUser.mutate({ userId: deleteTarget.id })}
                className="bg-red-500 hover:bg-red-600 text-white">
                Remove User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
