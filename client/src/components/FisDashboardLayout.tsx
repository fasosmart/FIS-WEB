import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  Gavel,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sun,
  Truck,
  Users,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import type { TranslationKey } from "@/contexts/I18nContext";

// ─── Nav items definition ─────────────────────────────────────────────────
function getNavItems(t: (k: TranslationKey) => string) {
  return [
    {
      label: t("nav_core_modules"),
      items: [
        { href: "/",                    icon: LayoutDashboard, label: t("nav_dashboard"),          badge: undefined },
        { href: "/omcs",                icon: Building2,       label: t("nav_omc_registry"),       badge: undefined },
        { href: "/tax-returns",         icon: FileText,        label: t("nav_returns_filing"),     badge: undefined },
        { href: "/consignments",        icon: Truck,           label: t("nav_consignments"),       badge: undefined },
        { href: "/sicpa-verification",  icon: ShieldCheck,     label: t("nav_sicpa_verification"), badge: "Live" },
      ],
    },
    {
      label: t("nav_compliance"),
      items: [
        { href: "/payments",            icon: CreditCard,      label: t("nav_payments"),           badge: undefined },
        { href: "/audit-compliance",    icon: ClipboardList,   label: t("nav_audit_compliance"),   badge: undefined },
        { href: "/enforcement",         icon: Gavel,           label: t("nav_enforcement"),        badge: undefined },
        { href: "/reports-analytics",   icon: BarChart3,       label: t("nav_reports_analytics"),  badge: undefined },
      ],
    },
    {
      label: t("nav_intelligence"),
      items: [
        { href: "/ai-assistant",        icon: Brain,           label: t("nav_ai_assistant"),       badge: "AI" },
      ],
    },
    {
      label: t("nav_system"),
      items: [
        { href: "/users",               icon: Users,           label: t("nav_users_roles"),        badge: undefined },
        { href: "/settings",            icon: Settings,        label: t("nav_system_settings"),    badge: undefined },
      ],
    },
  ];
}

// ─── Login Screen ─────────────────────────────────────────────────────────
function LoginScreen() {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();
  const demoLoginMutation = trpc.auth.demoLogin.useMutation({
    onSuccess: async (data) => {
      toast.success(`Signed in as ${data.name}`);
      await utils.auth.me.invalidate();
    },
    onError: (err) => {
      toast.error(`Demo login failed: ${err.message}`);
    },
  });

  const handleDemoLogin = (role: "demo-admin" | "demo-officer" | "demo-omc") => {
    demoLoginMutation.mutate({ role });
  };

  const isPending = demoLoginMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center gap-1 bg-card/80 border border-border rounded-lg p-1 backdrop-blur-sm">
          <Globe className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          {(["en", "fr"] as const).map(l => (
            <button key={l} onClick={() => setLocale(l)}
              className={cn(
                "text-xs px-2 py-1 rounded-md font-medium transition-all duration-150",
                locale === l
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              {l === "en" ? "EN" : "FR"}
            </button>
          ))}
        </div>
        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="p-2 bg-card/80 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm"
          title={theme === "dark" ? t("theme_light") : t("theme_dark")}>
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT PANEL */}
        <div className="hidden lg:flex flex-col w-1/2 bg-[#0d1829] border-r border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d1829] via-[#0f1f35] to-[#0a1220]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col h-full p-10">
            <div className="flex items-center gap-6 mb-10">
              <img src="/manus-storage/sierra-leone-coat-of-arms-2_4e182936.jpg" alt="Sierra Leone Coat of Arms" className="w-20 h-20 object-contain" />
              <div className="w-px h-16 bg-border" />
              <img src="/manus-storage/logo-fasosmart_aed06075.png" alt="FASOSMART" className="h-16 object-contain" />
            </div>

            <div className="mb-8">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">{t("login_nra_label")}</p>
              <h1 className="text-4xl font-bold text-white leading-tight mb-3">
                {t("login_title")}<br />
                <span className="text-primary">{t("login_title_accent")}</span>
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed">{t("login_description")}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              {[
                { icon: ShieldCheck, titleKey: "login_feature_sicpa_title" as TranslationKey, descKey: "login_feature_sicpa_desc" as TranslationKey },
                { icon: BarChart3,   titleKey: "login_feature_revenue_title" as TranslationKey, descKey: "login_feature_revenue_desc" as TranslationKey },
                { icon: FileText,    titleKey: "login_feature_filing_title" as TranslationKey, descKey: "login_feature_filing_desc" as TranslationKey },
                { icon: Gavel,       titleKey: "login_feature_enforcement_title" as TranslationKey, descKey: "login_feature_enforcement_desc" as TranslationKey },
              ].map((f) => (
                <div key={f.titleKey} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t(f.titleKey)}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">{t("login_developed_by")}</p>
              <div className="flex items-center gap-3">
                <img src="/manus-storage/logo-fasosmart_aed06075.png" alt="FASOSMART" className="h-8 object-contain" />
                <div>
                  <p className="text-xs font-semibold text-white">FASOSMART</p>
                  <a href="https://fasosmart.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">fasosmart.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col flex-1 items-center justify-center px-6 py-10 bg-background">
          <div className="flex lg:hidden items-center gap-4 mb-6">
            <img src="/manus-storage/sierra-leone-coat-of-arms-2_4e182936.jpg" alt="Sierra Leone Coat of Arms" className="w-14 h-14 object-contain" />
            <div className="w-px h-10 bg-border" />
            <img src="/manus-storage/logo-fasosmart_aed06075.png" alt="FASOSMART" className="h-10 object-contain" />
          </div>

          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-1">{t("login_welcome")}</h2>
              <p className="text-sm text-muted-foreground">{t("login_subtitle")}</p>
            </div>

            <a href={getLoginUrl()}
              className="inline-flex items-center gap-2 px-6 py-3 fis-gradient text-white font-semibold rounded-lg text-sm w-full justify-center mb-4">
              <Shield className="w-4 h-4" />
              {t("login_sign_in_btn")}
            </a>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider text-center">{t("login_demo_access")}</p>
              <div className="flex flex-col gap-2">
                {[
                  { role: "demo-admin" as const,   label: t("login_demo_admin"),   icon: Shield,    cls: "border-[#e91e8c]/40 text-[#e91e8c] hover:bg-[#e91e8c]/10" },
                  { role: "demo-officer" as const, label: t("login_demo_officer"), icon: Users,     cls: "border-border text-muted-foreground hover:bg-muted/20" },
                  { role: "demo-omc" as const,     label: t("login_demo_omc"),     icon: Building2, cls: "border-border text-muted-foreground hover:bg-muted/20" },
                ].map(b => (
                  <button key={b.role} onClick={() => handleDemoLogin(b.role)} disabled={isPending}
                    className={cn("inline-flex items-center gap-2 px-4 py-2 bg-card border font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full", b.cls)}>
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <b.icon className="w-3.5 h-3.5" />}
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-border bg-card py-3 px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {t("footer_copyright")}</p>
        <p className="text-xs text-muted-foreground">
          {t("footer_developed_by")}{" "}
          <a href="https://fasosmart.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">FASOSMART</a>
        </p>
      </footer>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────
interface FisDashboardLayoutProps {
  children: React.ReactNode;
}

export default function FisDashboardLayout({ children }: FisDashboardLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const NAV_ITEMS = getNavItems(t);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const roleLabel = user?.role === "nra_admin"    ? t("role_nra_admin")
    : user?.role === "tax_officer" ? t("role_tax_officer")
    : user?.role === "omc_user"    ? t("role_omc_user")
    : user?.role === "admin"       ? t("role_admin")
    : t("role_user");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col h-full transition-all duration-300 ease-out border-r border-border bg-sidebar",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border min-h-[72px]">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5 p-0.5">
            <img src="/manus-storage/sierra-leone-coat-of-arms-2_4e182936.jpg" alt="Sierra Leone Coat of Arms" className="w-full h-full object-contain" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-sidebar-foreground leading-tight">Fuel Integrity</p>
              <p className="text-sm font-bold text-primary leading-tight">Solution (FIS)</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">National Revenue Authority</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sierra Leone</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {NAV_ITEMS.map((group) => (
            <div key={group.label}>
              {sidebarOpen && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <span className={cn(
                          "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-150",
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          !sidebarOpen && "justify-center"
                        )} title={!sidebarOpen ? item.label : undefined}>
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {sidebarOpen && (
                            <>
                              <span className="flex-1">{item.label}</span>
                              {item.badge && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Sidebar bottom controls ── */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {/* Theme + Language row */}
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button onClick={toggleTheme}
                className="flex items-center gap-1.5 flex-1 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                title={theme === "dark" ? t("theme_light") : t("theme_dark")}>
                {theme === "dark"
                  ? <><Sun className="w-3.5 h-3.5 text-amber-400" /><span>{t("theme_light")}</span></>
                  : <><Moon className="w-3.5 h-3.5 text-blue-400" /><span>{t("theme_dark")}</span></>
                }
              </button>
              {/* Language switcher */}
              <div className="flex items-center gap-0.5 bg-sidebar-accent rounded-md p-0.5">
                {(["en", "fr"] as const).map(l => (
                  <button key={l} onClick={() => setLocale(l)}
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-1 rounded transition-all duration-150",
                      locale === l
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-sidebar-foreground"
                    )}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Collapsed: icon-only controls */}
          {!sidebarOpen && (
            <div className="flex flex-col items-center gap-1">
              <button onClick={toggleTheme}
                className="p-1.5 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                title={theme === "dark" ? t("theme_light") : t("theme_dark")}>
                {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
              </button>
              <button onClick={() => setLocale(locale === "en" ? "fr" : "en")}
                className="p-1.5 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                title={t("language")}>
                <Globe className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* User profile */}
          <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
            <div className="w-8 h-8 rounded-full fis-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() ?? "U"}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name ?? "User"}</p>
                <p className="text-[11px] text-muted-foreground truncate">{roleLabel}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={() => logoutMutation.mutate()}
                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                title={t("sidebar_sign_out")}>
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center gap-4 px-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder={t("header_search_placeholder")}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground hidden md:block">{t("header_period")}</span>
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <button onClick={() => toast.info("Export Report feature coming soon")}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 fis-gradient text-white text-xs font-semibold rounded-md">
              {t("header_export_report")}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-2 px-4 flex flex-col sm:flex-row items-center justify-between gap-1 flex-shrink-0">
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} {t("footer_copyright")}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t("footer_developed_by")}{" "}
            <a href="https://fasosmart.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">FASOSMART</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
