import { Switch, Route } from "wouter";
import { useTranslation } from "react-i18next";
import { Toggle } from "@/components/ui/toggle";
import { Globe } from "lucide-react";
import { Sa, Us } from 'react-flags-select';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import KioskPage from "@/pages/kiosk";
import AdminPage from "@/pages/admin";
import LoginPage from "@/pages/login";
import LanguageToggle from "./components/ui/language-toggle";

function Router() {
  return (
    <Switch>
      <Route path="/">{() => { window.location.replace('/login'); return null; }}</Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { i18n, t } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  return (
    <div dir={dir} style={{ minHeight: '100vh' }}>
      <QueryClientProvider client={queryClient}>
        
        <TooltipProvider>
          <div
            style={{
              position: 'fixed',
              top: 10,
              right: dir === 'rtl' ? 'auto' : 10,
              left: dir === 'rtl' ? 10 : 'auto',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexDirection: dir === 'rtl' ? 'row-reverse' : 'row',
            }}
          >
          </div>
          {/* <Toaster /> */}
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
