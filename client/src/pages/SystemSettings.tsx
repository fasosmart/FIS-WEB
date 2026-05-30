import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings, Shield, Bell, Database, Link2, Zap,
  CheckCircle2, AlertTriangle, RefreshCw, Save,
  Building2, Globe, Mail, Phone, FileText, Clock,
} from "lucide-react";

type Section = "general" | "sicpa" | "notifications" | "audit" | "integrations" | "security";

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "general",       label: "General",        icon: Settings   },
  { id: "sicpa",         label: "SICPA Engine",   icon: Zap        },
  { id: "notifications", label: "Notifications",  icon: Bell       },
  { id: "audit",         label: "Audit Settings", icon: FileText   },
  { id: "integrations",  label: "Integrations",   icon: Link2      },
  { id: "security",      label: "Security",       icon: Shield     },
];

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border/20 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      <Separator className="mt-4 bg-border/30" />
    </div>
  );
}

export default function SystemSettings() {
  const [activeSection, setActiveSection] = useState<Section>("general");
  const [saving, setSaving] = useState(false);

  // General settings state
  const [orgName, setOrgName] = useState("National Revenue Authority");
  const [orgCountry, setOrgCountry] = useState("Sierra Leone");
  const [currency, setCurrency] = useState("NLE");
  const [timezone, setTimezone] = useState("Africa/Freetown");
  const [fiscalYear, setFiscalYear] = useState("January");

  // SICPA settings
  const [sicpaEnabled, setSicpaEnabled] = useState(true);
  const [sicpaThreshold, setSicpaThreshold] = useState("5");
  const [sicpaAutoFlag, setSicpaAutoFlag] = useState(true);
  const [sicpaSyncInterval, setSicpaSyncInterval] = useState("24");
  const [sicpaAutoEnforce, setSicpaAutoEnforce] = useState(false);

  // Notification settings
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [discrepancyAlert, setDiscrepancyAlert] = useState(true);
  const [overdueAlert, setOverdueAlert] = useState(true);
  const [paymentAlert, setPaymentAlert] = useState(true);
  const [enforcementAlert, setEnforcementAlert] = useState(true);
  const [notifEmail, setNotifEmail] = useState("admin@nra.gov.sl");

  // Audit settings
  const [auditRetention, setAuditRetention] = useState("365");
  const [auditAllActions, setAuditAllActions] = useState(true);
  const [auditLoginEvents, setAuditLoginEvents] = useState(true);
  const [auditExports, setAuditExports] = useState(true);

  // Security settings
  const [sessionTimeout, setSessionTimeout] = useState("480");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved successfully");
    }, 800);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return (
          <div>
            <SectionHeader title="General Settings" description="Configure organisation details and platform defaults" />
            <SettingRow label="Organisation Name" description="Official name of the revenue authority">
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)}
                className="w-64 bg-secondary/20 border-border/40 text-sm h-8" />
            </SettingRow>
            <SettingRow label="Country" description="Jurisdiction of the platform">
              <Input value={orgCountry} onChange={(e) => setOrgCountry(e.target.value)}
                className="w-64 bg-secondary/20 border-border/40 text-sm h-8" />
            </SettingRow>
            <SettingRow label="Currency Code" description="Primary currency for tax calculations">
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="w-32 bg-secondary/20 border-border/40 text-sm h-8" />
            </SettingRow>
            <SettingRow label="Timezone" description="Server and display timezone">
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)}
                className="w-48 bg-secondary/20 border-border/40 text-sm h-8" />
            </SettingRow>
            <SettingRow label="Fiscal Year Start" description="First month of the fiscal year">
              <Input value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)}
                className="w-40 bg-secondary/20 border-border/40 text-sm h-8" />
            </SettingRow>
            <SettingRow label="Fuel Levy Rate" description="Current levy rate per litre (NLE)">
              <div className="flex items-center gap-2">
                <Input value="5.00" readOnly className="w-24 bg-secondary/20 border-border/40 text-sm h-8" />
                <span className="text-xs text-muted-foreground">NLE/L</span>
              </div>
            </SettingRow>
          </div>
        );

      case "sicpa":
        return (
          <div>
            <SectionHeader title="SICPA Verification Engine" description="Configure the SICPA integration and discrepancy detection rules" />
            <SettingRow label="SICPA Integration" description="Enable real-time SICPA volume verification">
              <div className="flex items-center gap-2">
                <Switch checked={sicpaEnabled} onCheckedChange={setSicpaEnabled} />
                <Badge variant="outline" className="text-xs"
                  style={sicpaEnabled ? { borderColor: "#10b981", color: "#10b981" } : {}}>
                  {sicpaEnabled ? "Active" : "Disabled"}
                </Badge>
              </div>
            </SettingRow>
            <SettingRow label="Discrepancy Threshold (%)" description="Variance % above which a discrepancy is flagged">
              <div className="flex items-center gap-2">
                <Input value={sicpaThreshold} onChange={(e) => setSicpaThreshold(e.target.value)}
                  type="number" min="1" max="50"
                  className="w-24 bg-secondary/20 border-border/40 text-sm h-8" />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </SettingRow>
            <SettingRow label="Auto-Flag Discrepancies" description="Automatically flag volumes exceeding threshold">
              <Switch checked={sicpaAutoFlag} onCheckedChange={setSicpaAutoFlag} />
            </SettingRow>
            <SettingRow label="Sync Interval (hours)" description="How often to sync SICPA data">
              <div className="flex items-center gap-2">
                <Input value={sicpaSyncInterval} onChange={(e) => setSicpaSyncInterval(e.target.value)}
                  type="number" min="1" max="168"
                  className="w-24 bg-secondary/20 border-border/40 text-sm h-8" />
                <span className="text-xs text-muted-foreground">hrs</span>
              </div>
            </SettingRow>
            <SettingRow label="Auto-Create Enforcement Case" description="Automatically open enforcement case for critical discrepancies">
              <Switch checked={sicpaAutoEnforce} onCheckedChange={setSicpaAutoEnforce} />
            </SettingRow>
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-green-400">SICPA Connection Active</p>
                <p className="text-[10px] text-muted-foreground">Last sync: May 31, 2026 07:50 AM · 17,142,000 L verified</p>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div>
            <SectionHeader title="Notification Settings" description="Configure alert channels and notification triggers" />
            <SettingRow label="Email Notifications" description="Send alerts via email">
              <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
            </SettingRow>
            <SettingRow label="SMS Notifications" description="Send alerts via SMS (requires SMS gateway)">
              <Switch checked={smsNotifs} onCheckedChange={setSmsNotifs} />
            </SettingRow>
            <SettingRow label="Notification Email" description="Primary email address for system alerts">
              <Input value={notifEmail} onChange={(e) => setNotifEmail(e.target.value)}
                className="w-64 bg-secondary/20 border-border/40 text-sm h-8" />
            </SettingRow>
            <Separator className="my-4 bg-border/20" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Alert Triggers</p>
            <SettingRow label="Discrepancy Alerts" description="Notify when SICPA variance exceeds threshold">
              <Switch checked={discrepancyAlert} onCheckedChange={setDiscrepancyAlert} />
            </SettingRow>
            <SettingRow label="Overdue Return Alerts" description="Notify when a tax return is overdue">
              <Switch checked={overdueAlert} onCheckedChange={setOverdueAlert} />
            </SettingRow>
            <SettingRow label="Payment Received Alerts" description="Notify when a payment is confirmed">
              <Switch checked={paymentAlert} onCheckedChange={setPaymentAlert} />
            </SettingRow>
            <SettingRow label="Enforcement Action Alerts" description="Notify when enforcement cases are opened or resolved">
              <Switch checked={enforcementAlert} onCheckedChange={setEnforcementAlert} />
            </SettingRow>
          </div>
        );

      case "audit":
        return (
          <div>
            <SectionHeader title="Audit Settings" description="Configure audit log retention and tracking scope" />
            <SettingRow label="Log Retention (days)" description="Number of days to retain audit logs">
              <div className="flex items-center gap-2">
                <Input value={auditRetention} onChange={(e) => setAuditRetention(e.target.value)}
                  type="number" min="30" max="3650"
                  className="w-24 bg-secondary/20 border-border/40 text-sm h-8" />
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            </SettingRow>
            <SettingRow label="Log All Actions" description="Record every user action in the audit trail">
              <Switch checked={auditAllActions} onCheckedChange={setAuditAllActions} />
            </SettingRow>
            <SettingRow label="Log Login Events" description="Record all login and logout events">
              <Switch checked={auditLoginEvents} onCheckedChange={setAuditLoginEvents} />
            </SettingRow>
            <SettingRow label="Log Data Exports" description="Record every CSV/PDF export action">
              <Switch checked={auditExports} onCheckedChange={setAuditExports} />
            </SettingRow>
            <div className="mt-4 p-3 bg-secondary/20 border border-border/30 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total audit records</span>
                <span className="font-semibold text-foreground">1,247 entries</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">Oldest record</span>
                <span className="font-semibold text-foreground">Jan 1, 2026</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">Storage used</span>
                <span className="font-semibold text-foreground">4.2 MB</span>
              </div>
            </div>
          </div>
        );

      case "integrations":
        return (
          <div>
            <SectionHeader title="Integrations" description="Manage external system connections and API access" />
            {[
              { name: "SICPA Fuel Marking", status: "connected", color: "#10b981", desc: "Real-time volume verification", icon: Zap },
              { name: "NRA Core Tax System", status: "connected", color: "#10b981", desc: "Tax registration and assessment data", icon: Database },
              { name: "Bank of Sierra Leone", status: "pending", color: "#f59e0b", desc: "Payment confirmation gateway", icon: Building2 },
              { name: "ECOWAS Trade Portal", status: "disconnected", color: "#ef4444", desc: "Cross-border fuel movement data", icon: Globe },
              { name: "SMS Gateway (Africell)", status: "disconnected", color: "#ef4444", desc: "SMS notification delivery", icon: Phone },
              { name: "Email Service (SMTP)", status: "connected", color: "#10b981", desc: "Email notification delivery", icon: Mail },
            ].map((intg) => (
              <div key={intg.name} className="flex items-center justify-between py-4 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${intg.color}18` }}>
                    <intg.icon className="w-4 h-4" style={{ color: intg.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{intg.name}</p>
                    <p className="text-xs text-muted-foreground">{intg.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs"
                    style={{ borderColor: intg.color, color: intg.color }}>
                    {intg.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
                    onClick={() => toast.info(`${intg.name} configuration — Feature coming soon`)}>
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      case "security":
        return (
          <div>
            <SectionHeader title="Security Settings" description="Configure authentication and access security policies" />
            <SettingRow label="Session Timeout (minutes)" description="Automatically log out inactive users">
              <div className="flex items-center gap-2">
                <Input value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)}
                  type="number" min="15" max="1440"
                  className="w-24 bg-secondary/20 border-border/40 text-sm h-8" />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </SettingRow>
            <SettingRow label="Require MFA" description="Enforce multi-factor authentication for all users">
              <div className="flex items-center gap-2">
                <Switch checked={mfaRequired} onCheckedChange={setMfaRequired} />
                {mfaRequired && (
                  <Badge variant="outline" className="text-xs border-green-500/40 text-green-400">Enforced</Badge>
                )}
              </div>
            </SettingRow>
            <SettingRow label="IP Whitelist" description="Restrict access to approved IP addresses only">
              <Switch checked={ipWhitelist} onCheckedChange={setIpWhitelist} />
            </SettingRow>
            <Separator className="my-4 bg-border/20" />
            <div className="p-3 bg-secondary/20 border border-border/30 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Security Status</p>
              {[
                { label: "OAuth 2.0 Authentication", ok: true },
                { label: "HTTPS / TLS 1.3 Encryption", ok: true },
                { label: "JWT Session Tokens", ok: true },
                { label: "Role-Based Access Control", ok: true },
                { label: "Multi-Factor Authentication", ok: mfaRequired },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  {item.ok
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Platform configuration and integration management</p>
        </div>
        <Button onClick={handleSave} disabled={saving}
          style={{ background: "#e91e8c" }} className="text-white hover:opacity-90 h-8 text-xs gap-1.5">
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="flex gap-5">
        {/* Sidebar Nav */}
        <div className="w-48 shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${
                  activeSection === s.id
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
                style={activeSection === s.id ? { background: "#e91e8c" } : {}}>
                <s.icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-card/50 border border-border/40 rounded-2xl p-6">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
