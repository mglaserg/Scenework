import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import FocusPage from "@/pages/FocusPage";
import EmotionDrillPage from "@/pages/EmotionDrillPage";
import JournalPage from "@/pages/JournalPage";
import TimerPage from "@/pages/TimerPage";
import ScenePartnerPage from "@/pages/ScenePartnerPage";
import WarmUpPage from "@/pages/WarmUpPage";
import YesAndPage from "@/pages/YesAndPage";
import CharacterPage from "@/pages/CharacterPage";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";

function Router() {
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}
