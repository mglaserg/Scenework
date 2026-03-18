import { Switch, Route, Router as WouterRouter } from "wouter";
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

// ─── Private route wrapper ────────────────────────────────────────────────────
// Shows AuthPage or ReauthPage when the user isn't fully authenticated.

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, dataKey, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "hsl(38 8% 50%)",
          fontFamily: "'Zodiak', serif",
          fontSize: "1rem",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!user) return <AuthPage />;
  if (!dataKey) return <ReauthPage />;

  return <Component />;
}

// ─── App routes ───────────────────────────────────────────────────────────────

function AppRoutes() {
  const { isLoading } = useAuth();

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

  return (
    <WouterRouter hook={useHashLocation}>
      <Layout>
        <Switch>
          {/* ── SHARED — accessible without login ──────────────────────────── */}
          <Route path="/" component={FocusPage} />
          <Route path="/focus" component={FocusPage} />
          <Route path="/emotion-drill" component={EmotionDrillPage} />
          <Route path="/warmup" component={WarmUpPage} />
          <Route path="/timer" component={TimerPage} />

          {/* ── PRIVATE — require full auth + encryption key ─────────────── */}
          <Route path="/journal">
            {() => <PrivateRoute component={JournalPage} />}
          </Route>
          <Route path="/scene-partner">
            {() => <PrivateRoute component={ScenePartnerPage} />}
          </Route>
          <Route path="/yes-and">
            {() => <PrivateRoute component={YesAndPage} />}
          </Route>
          <Route path="/character">
            {() => <PrivateRoute component={CharacterPage} />}
          </Route>

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
