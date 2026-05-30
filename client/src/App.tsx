import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import FisDashboardLayout from "./components/FisDashboardLayout";
import Dashboard from "./pages/Dashboard";
import OmcList from "./pages/OmcList";
import OmcDetail from "./pages/OmcDetail";
import TaxReturns from "./pages/TaxReturns";
import Consignments from "./pages/Consignments";
import SicpaVerification from "./pages/SicpaVerification";
import AuditCompliance from "./pages/AuditCompliance";
import Enforcement from "./pages/Enforcement";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import Payments from "./pages/Payments";
import UsersRoles from "./pages/UsersRoles";
import SystemSettings from "./pages/SystemSettings";
import AiAssistant from "./pages/AiAssistant";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <FisDashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/omcs" component={OmcList} />
        <Route path="/omcs/:id" component={OmcDetail} />
        <Route path="/tax-returns" component={TaxReturns} />
        <Route path="/consignments" component={Consignments} />
        <Route path="/sicpa-verification" component={SicpaVerification} />
        <Route path="/audit-compliance" component={AuditCompliance} />
        <Route path="/enforcement" component={Enforcement} />
        <Route path="/reports-analytics" component={ReportsAnalytics} />
        <Route path="/payments" component={Payments} />
        <Route path="/users" component={UsersRoles} />
        <Route path="/settings" component={SystemSettings} />
        <Route path="/ai-assistant" component={AiAssistant} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </FisDashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
