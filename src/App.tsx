import { useEffect, type ReactNode } from "react";
import { Route, Routes, useLocation, useSearchParams } from "react-router";
import { MotionConfig, motion } from "motion/react";
import { AppStateProvider, useApp } from "@/state/app-state";
import { ThemeProvider } from "@/state/theme";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { CompareTray } from "@/components/layout/CompareTray";
import { CallbackDialog } from "@/components/CallbackDialog";
import { ConciergeLauncher, ConciergePanel } from "@/components/concierge/ConciergePanel";
import { Intro } from "@/components/Intro";
import { ViewTransitions } from "@/components/ViewTransitions";
import { SearchSpotlight } from "@/components/SearchSpotlight";
import { ease } from "@/lib/motion";
// Pages load up front: page transitions snapshot the new page immediately,
// and a lazy chunk would show its loading state in that snapshot.
import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import CarDetail from "@/pages/CarDetail";
import Match from "@/pages/Match";
import Sell from "@/pages/Sell";
import Services from "@/pages/Services";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Compare from "@/pages/Compare";
import Shortlist from "@/pages/Shortlist";
import Credits from "@/pages/Credits";
import NotFound from "@/pages/NotFound";

function ScrollReset() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname, hash]);
  return null;
}

/** `?ask=…` on any URL opens the Co-Driver with that question, e.g. from an Instagram bio link. */
function AskDeepLink() {
  const [params, setParams] = useSearchParams();
  const { openConcierge } = useApp();
  const ask = params.get("ask");
  useEffect(() => {
    if (!ask) return;
    openConcierge(ask);
    const next = new URLSearchParams(params);
    next.delete("ask");
    setParams(next, { replace: true });
    // Runs once per question; params and setters would re-trigger it.
  }, [ask]);
  return null;
}

// With View Transitions the wipe is the page change; elsewhere, a quick fade.
const nativeTransitions = typeof document !== "undefined" && "startViewTransition" in document;

function Page({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <motion.div key={pathname} data-path={pathname} initial={nativeTransitions ? false : { opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.35, ease: ease.standard } }}>
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AppStateProvider>
          <ScrollReset />
          <AskDeepLink />
          <ViewTransitions />
          <Intro />
          <a href="#main" data-no-vt className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-bg">
            Skip to content
          </a>
          <Header />
          <main id="main" className="min-h-[60dvh]">
            <Page>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cars" element={<Inventory />} />
                <Route path="/cars/:id" element={<CarDetail />} />
                <Route path="/match" element={<Match />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/services" element={<Services />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/shortlist" element={<Shortlist />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Page>
          </main>
          <Footer />
          <MobileTabBar />
          <CompareTray />
          <ConciergeLauncher />
          <ConciergePanel />
          <CallbackDialog />
          <SearchSpotlight />
        </AppStateProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
