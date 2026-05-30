# FIS — Fuel Integrity Solution · TODO

## Phase 1 — DB Schema & Global Theme
- [x] Configure dark navy/magenta theme in index.css with Space Grotesk font
- [x] Define DB schema: omcs, tax_returns, consignments, sicpa_records, audit_logs, enforcement_cases
- [x] Apply DB migrations via webdev_execute_sql
- [x] Add DB query helpers in server/db.ts

## Phase 2 — RBAC, Routing & Navigation
- [x] Extend user roles: nra_admin, tax_officer, omc_user
- [x] Configure FisDashboardLayout with full sidebar navigation (9 modules)
- [x] Set up App.tsx routes for all modules
- [x] Implement role-based route guards (nraProcedure, adminProcedure)

## Phase 3 — Executive Dashboard
- [x] KPI cards: Monthly Revenue, Fiscal Gap, SICPA-Verified Volume, Compliance Rate
- [x] Declared vs Verified Volume area chart (Recharts)
- [x] Revenue Gap donut chart
- [x] Compliance Status gauge
- [x] Top 5 Discrepancies table
- [x] Returns Filing Status chart
- [x] Alerts & Notifications panel
- [x] Quick Actions panel

## Phase 4 — Core Modules
- [x] OMC Registration & Master Data Management (list, create, edit, view)
- [x] Tax Return Filing (Excise Duty, VAT, Petroleum Levy)
- [x] Consignment & Supply Chain Tracking (depot uplift transactions)
- [x] SICPA Verification Engine (declared vs verified, auto-flag discrepancies)

## Phase 5 — Compliance & Analytics Modules
- [x] Audit & Compliance module (transaction traceability, audit logs)
- [x] Enforcement Workflow (assessment notices, penalties, interest, case queue)
- [x] Reporting & Analytics (variance charts, OMC compliance, revenue trends)

## Phase 6 — Quality & Delivery
- [x] Write Vitest tests (14 tests passing — auth, dashboard, omcs, tax returns, consignments, sicpa, enforcement, audit)
- [x] Final review and checkpoint

## Round 2 — Interactive Charts & Auto-Calculation
- [x] Auto-calculation of tax amount at 5 NLE per declared litre in Tax Returns form
- [x] Live preview of calculated amount as user types volume
- [x] Interactive Dashboard charts (tooltips, hover, click-through)
- [x] Interactive SICPA Verification charts (bar chart with hover details)
- [x] Interactive Reports & Analytics charts (line, bar, pie with tooltips and filters)
- [x] Interactive Consignments chart

## Round 3 — Payments Module & Clickable Elements
- [ ] DB schema: payments table (ref, omcId, amount, status, proofUrl, type)
- [ ] DB schema: penalties table (ref, omcId, enforcementId, amount, reason, status, dueDate)
- [ ] tRPC router: payments.list, payments.get, payments.create, payments.uploadProof
- [ ] tRPC router: penalties.list, penalties.get, penalties.create
- [ ] Payments page: list with ref, status badge, amount, OMC, date
- [ ] Payments page: detail modal (full payment info + proof PDF viewer)
- [ ] Payments page: PDF proof upload and inline PDF viewer in modal
- [ ] Penalties tab: list with ref, reason, amount, due date, status
- [ ] Penalties detail modal
- [ ] Make all table rows clickable across all modules (OMC, Tax Returns, Consignments, SICPA, Enforcement, Audit)
- [ ] Add Payments to sidebar navigation

## Round 4 — Reports & Analytics Enrichissement
- [ ] Router tRPC reports avec filtres (omcId, period, productType, paymentStatus)
- [ ] Sous-menus Reports : Revenue, Compliance, SICPA, Payments, Enforcement, OMC Performance
- [ ] Filtres avancés sur tous les graphiques (OMC, période, produit, statut)
- [ ] Export CSV pour chaque rapport
- [ ] Export PDF (print-ready) pour chaque rapport
- [ ] Rapport Revenue — tendance mensuelle filtrée
- [ ] Rapport Compliance — scores par OMC filtrés
- [ ] Rapport SICPA — discrepances filtrées par produit/OMC
- [ ] Rapport Payments — récapitulatif paiements filtrés
- [ ] Rapport Enforcement — cas ouverts/résolus filtrés
- [ ] Rapport OMC Performance — classement OMC

## Round 6 — Production Demo + Missing Pages
- [x] Enable demo login in production (remove NODE_ENV check)
- [x] Create Users & Roles page (user management, role assignment)
- [x] Create System Settings page (app config, integrations, audit settings)
- [x] Register /users and /settings routes in App.tsx

## Round 8 — Charts Fix + AI Module
- [x] Fix Revenue Overview chart — getRevenueChartData now expands quarters into monthly data points
- [x] Fix Volume Tracking chart — declared/verified volumes now aligned per period
- [x] Fix Top 5 Discrepancies chart — flag mapping corrected (high/medium/low)
- [x] Add Declared vs SICPA vs Gap comparison chart on Dashboard
- [x] Create FIS Intelligence Assistant page (/ai-assistant) with AIChatBox
- [x] AI: tRPC router ai.chat with invokeLLM and real-time FIS context injection
- [x] AI: Suggested prompts for compliance, revenue, SICPA, enforcement analysis
- [x] AI: Natural language query interface for tax data
- [x] Register /ai-assistant route in App.tsx and sidebar (INTELLIGENCE group)
