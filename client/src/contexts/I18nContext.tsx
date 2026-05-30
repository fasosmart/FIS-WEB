import React, { createContext, useContext, useState, useCallback } from "react";

export type Locale = "en" | "fr";

// ─── Translation dictionary ────────────────────────────────────────────────
const translations = {
  en: {
    // Navigation groups
    nav_core_modules: "CORE MODULES",
    nav_compliance: "COMPLIANCE",
    nav_intelligence: "INTELLIGENCE",
    nav_system: "SYSTEM",
    // Nav items
    nav_dashboard: "Dashboard",
    nav_omc_registry: "OMC Registry",
    nav_returns_filing: "Returns & Filing",
    nav_consignments: "Consignments",
    nav_sicpa_verification: "SICPA Verification",
    nav_payments: "Payments",
    nav_audit_compliance: "Audit & Compliance",
    nav_enforcement: "Enforcement",
    nav_reports_analytics: "Reports & Analytics",
    nav_ai_assistant: "AI Assistant",
    nav_users_roles: "Users & Roles",
    nav_system_settings: "System Settings",
    // Login screen
    login_nra_label: "National Revenue Authority · Sierra Leone",
    login_title: "Fuel Integrity",
    login_title_accent: "Solution (FIS)",
    login_description: "A government-grade petroleum tax administration platform designed to ensure full compliance, eliminate fiscal leakage, and strengthen revenue assurance across Sierra Leone's fuel supply chain.",
    login_feature_sicpa_title: "SICPA Verification Engine",
    login_feature_sicpa_desc: "Real-time cross-validation of declared vs. verified fuel volumes with automatic discrepancy flagging.",
    login_feature_revenue_title: "Revenue Intelligence",
    login_feature_revenue_desc: "Live KPI dashboards, fiscal gap analysis, and OMC compliance scoring for NRA decision-makers.",
    login_feature_filing_title: "End-to-End Tax Filing",
    login_feature_filing_desc: "Quarterly excise duty, VAT and petroleum levy declarations with automated 5 NLE/litre calculation.",
    login_feature_enforcement_title: "Enforcement Workflow",
    login_feature_enforcement_desc: "Statutory assessment notices, penalty generation and full audit trail for regulatory action.",
    login_developed_by: "Developed & maintained by",
    login_welcome: "Welcome Back",
    login_subtitle: "Sign in to access the FIS platform",
    login_sign_in_btn: "Sign in with NRA Credentials",
    login_demo_access: "Demo Access (Testing)",
    login_demo_admin: "Login as NRA Admin",
    login_demo_officer: "Login as Tax Officer",
    login_demo_omc: "Login as OMC Portal User",
    // Header
    header_search_placeholder: "Search OMC, return, consignment...",
    header_export_report: "Export Report",
    header_period: "May 01 – May 31, 2026",
    // Footer
    footer_copyright: "Fuel Integrity Solution (FIS) — National Revenue Authority, Sierra Leone. All rights reserved.",
    footer_developed_by: "Developed by",
    // Sidebar footer
    sidebar_sign_out: "Sign out",
    // Theme
    theme_dark: "Dark Mode",
    theme_light: "Light Mode",
    // Language
    language: "Language",
    lang_en: "English",
    lang_fr: "Français",
    // Roles
    role_nra_admin: "NRA Admin",
    role_tax_officer: "Tax Officer",
    role_omc_user: "OMC Portal User",
    role_admin: "Super Administrator",
    role_user: "User",
    // Common
    loading: "Loading FIS Platform...",
    back_to: "Back to",
    refresh: "Refresh",
    export: "Export",
    filter: "Filter",
    all: "All",
    search: "Search",
    status: "Status",
    date: "Date",
    amount: "Amount",
    type: "Type",
    reference: "Reference",
    actions: "Actions",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    view: "View",
    edit: "Edit",
    delete: "Delete",
    create: "Create",
    submit: "Submit",
    approve: "Approve",
    reject: "Reject",
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    completed: "Completed",
    failed: "Failed",
    // Dashboard
    dashboard_title: "Dashboard",
    dashboard_subtitle: "Real-time overview of petroleum tax compliance and revenue assurance",
    dashboard_live: "Live",
    // OMC
    omc_registry: "OMC Registry",
    omc_back: "Back to OMC Registry",
    omc_declarations: "Declarations",
    omc_volumes: "Volumes & SICPA",
    omc_payments: "Payments",
    omc_penalties: "Penalties",
    omc_analytics: "Analytics",
  },
  fr: {
    // Navigation groups
    nav_core_modules: "MODULES PRINCIPAUX",
    nav_compliance: "CONFORMITÉ",
    nav_intelligence: "INTELLIGENCE",
    nav_system: "SYSTÈME",
    // Nav items
    nav_dashboard: "Tableau de bord",
    nav_omc_registry: "Registre OMC",
    nav_returns_filing: "Déclarations",
    nav_consignments: "Consignations",
    nav_sicpa_verification: "Vérification SICPA",
    nav_payments: "Paiements",
    nav_audit_compliance: "Audit & Conformité",
    nav_enforcement: "Exécution",
    nav_reports_analytics: "Rapports & Analyses",
    nav_ai_assistant: "Assistant IA",
    nav_users_roles: "Utilisateurs & Rôles",
    nav_system_settings: "Paramètres Système",
    // Login screen
    login_nra_label: "Autorité Nationale des Revenus · Sierra Leone",
    login_title: "Solution d'Intégrité",
    login_title_accent: "des Carburants (FIS)",
    login_description: "Une plateforme gouvernementale d'administration fiscale pétrolière conçue pour assurer la pleine conformité, éliminer les fuites fiscales et renforcer l'assurance des revenus dans la chaîne d'approvisionnement en carburant de Sierra Leone.",
    login_feature_sicpa_title: "Moteur de Vérification SICPA",
    login_feature_sicpa_desc: "Validation croisée en temps réel des volumes de carburant déclarés et vérifiés avec signalement automatique des écarts.",
    login_feature_revenue_title: "Intelligence Fiscale",
    login_feature_revenue_desc: "Tableaux de bord KPI en direct, analyse des écarts fiscaux et scores de conformité OMC pour les décideurs de l'ANR.",
    login_feature_filing_title: "Déclaration Fiscale Complète",
    login_feature_filing_desc: "Déclarations trimestrielles de droits d'accise, TVA et prélèvement pétrolier avec calcul automatisé à 5 NLE/litre.",
    login_feature_enforcement_title: "Procédure d'Exécution",
    login_feature_enforcement_desc: "Avis d'évaluation statutaires, génération de pénalités et piste d'audit complète pour l'action réglementaire.",
    login_developed_by: "Développé et maintenu par",
    login_welcome: "Bienvenue",
    login_subtitle: "Connectez-vous pour accéder à la plateforme FIS",
    login_sign_in_btn: "Se connecter avec les identifiants ANR",
    login_demo_access: "Accès Démo (Test)",
    login_demo_admin: "Connexion en tant qu'Admin ANR",
    login_demo_officer: "Connexion en tant qu'Agent Fiscal",
    login_demo_omc: "Connexion en tant qu'Utilisateur OMC",
    // Header
    header_search_placeholder: "Rechercher OMC, déclaration, consignation...",
    header_export_report: "Exporter Rapport",
    header_period: "01 Mai – 31 Mai 2026",
    // Footer
    footer_copyright: "Solution d'Intégrité des Carburants (FIS) — Autorité Nationale des Revenus, Sierra Leone. Tous droits réservés.",
    footer_developed_by: "Développé par",
    // Sidebar footer
    sidebar_sign_out: "Se déconnecter",
    // Theme
    theme_dark: "Mode Sombre",
    theme_light: "Mode Clair",
    // Language
    language: "Langue",
    lang_en: "English",
    lang_fr: "Français",
    // Roles
    role_nra_admin: "Admin ANR",
    role_tax_officer: "Agent Fiscal",
    role_omc_user: "Utilisateur OMC",
    role_admin: "Super Administrateur",
    role_user: "Utilisateur",
    // Common
    loading: "Chargement de la plateforme FIS...",
    back_to: "Retour à",
    refresh: "Actualiser",
    export: "Exporter",
    filter: "Filtrer",
    all: "Tous",
    search: "Rechercher",
    status: "Statut",
    date: "Date",
    amount: "Montant",
    type: "Type",
    reference: "Référence",
    actions: "Actions",
    save: "Enregistrer",
    cancel: "Annuler",
    confirm: "Confirmer",
    close: "Fermer",
    view: "Voir",
    edit: "Modifier",
    delete: "Supprimer",
    create: "Créer",
    submit: "Soumettre",
    approve: "Approuver",
    reject: "Rejeter",
    active: "Actif",
    inactive: "Inactif",
    pending: "En attente",
    completed: "Complété",
    failed: "Échoué",
    // Dashboard
    dashboard_title: "Tableau de Bord",
    dashboard_subtitle: "Vue d'ensemble en temps réel de la conformité fiscale pétrolière et de l'assurance des revenus",
    dashboard_live: "En direct",
    // OMC
    omc_registry: "Registre OMC",
    omc_back: "Retour au Registre OMC",
    omc_declarations: "Déclarations",
    omc_volumes: "Volumes & SICPA",
    omc_payments: "Paiements",
    omc_penalties: "Pénalités",
    omc_analytics: "Analyses",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

// ─── Context ───────────────────────────────────────────────────────────────
interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return (localStorage.getItem("fis_locale") as Locale) ?? "en";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("fis_locale", l);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return (translations[locale] as Record<string, string>)[key]
        ?? (translations.en as Record<string, string>)[key]
        ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
