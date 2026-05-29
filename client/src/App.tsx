import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import { LoginPage, SignupPage } from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import IncomePage from "@/pages/income";
import DealsPage from "@/pages/deals";
import TaxPage from "@/pages/tax";
import InvoicesPage from "@/pages/invoices";
import PricingPage from "@/pages/pricing";
import CollabsPage from "@/pages/collabs";
import CollabsNewPage from "@/pages/collabs-new";
import MyCollabsPage from "@/pages/my-collabs";

function Authed({ Page }: { Page: () => JSX.Element }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Page />
      </AppLayout>
    </ProtectedRoute>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/dashboard">{() => <Authed Page={Dashboard} />}</Route>
      <Route path="/income">{() => <Authed Page={IncomePage} />}</Route>
      <Route path="/deals">{() => <Authed Page={DealsPage} />}</Route>
      <Route path="/tax">{() => <Authed Page={TaxPage} />}</Route>
      <Route path="/invoices">{() => <Authed Page={InvoicesPage} />}</Route>
      <Route path="/collabs">{() => <Authed Page={CollabsPage} />}</Route>
      <Route path="/collabs/new">{() => <Authed Page={CollabsNewPage} />}</Route>
      <Route path="/my-collabs">{() => <Authed Page={MyCollabsPage} />}</Route>
      <Route path="/pricing">{() => <Authed Page={PricingPage} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
