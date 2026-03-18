import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import FocusPage from "@/pages/FocusPage";
import EmotionDrillPage from "@/pages/EmotionDrillPage";
import JournalPage from "@/pages/JournalPage";
import TimerPage from "@/pages/TimerPage";
import ScenePartnerPage from "@/pages/ScenePartnerPage";
import WarmUpPage from "@/pages/WarmUpPage";
import YesAndPage from "@/pages/YesAndPage";
import CharacterPage from "@/pages/CharacterPage";
import AuthPage from "@/pages/AuthPage";
import ReauthPage from "@/pages/ReauthPage";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";

// ─── Auth gate ────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { user, dataKey, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "hsl(30 8% 7%)",
          color: "hsl(38 8% 50%)",
          fontFamily: "'Zodiak', serif",
          fontSize: "1rem",
        }}
      >
        Loading…
      </div>
    );
  }

  // Not logged in at all — show auth page
  if (!user) {
    return <AuthPage />;
  }

  // Logged in (session cookie alive) but key was lost on page refresh —
  // ask them to re-enter their password to restore the CryptoKey.
  if (!dataKey) {
    return <ReauthPage />;
  }

  // Fully authenticated — render the app
  return (
    <WouterRouter hook={useHashLocation}>
      <Layout>
        <Switch>
          <Route path="/" component={FocusPage} />
          <Route path="/focus" component={FocusPage} />
          <Route path="/emotion-drill" component={EmotionDrillPage} />
          <Route path="/journal" component={JournalPage} />
          <Route path="/timer" component={TimerPage} />
          <Route path="/scene-partner" component={ScenePartnerPage} />
          <Route path="/warmup" component={WarmUpPage} />
          <Route path="/yes-and" component={YesAndPage} />
          <Route path="/character" component={CharacterPage} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </WouterRouter>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
