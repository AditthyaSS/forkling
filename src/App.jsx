import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { FiWifiOff } from 'react-icons/fi';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RateLimitBanner from '@/components/RateLimitBanner';
import ScrollButtons from '@/components/ScrollButtons';
import SettingsModal from '@/components/SettingsModal';
import RepoLayout from '@/components/RepoLayout';
import CustomCursor from '@/components/CustomCursor';
import HomePage from '@/pages/HomePage';
import ComparePage from '@/pages/ComparePage';
import GuidePage from '@/pages/GuidePage';
import ModelsPage from '@/pages/ModelsPage';
import ModelDetailPage from '@/pages/ModelDetailPage';
import RepoOverviewPage from '@/pages/RepoOverviewPage';
import RepoContributorsPage from '@/pages/RepoContributorsPage';
import RepoNetworkPage from '@/pages/RepoNetworkPage';
import RepoAnalyticsPage from '@/pages/RepoAnalyticsPage';
import RepoIssuesPage from '@/pages/RepoIssuesPage';
import RepoGovernancePage from '@/pages/RepoGovernancePage';
import RepoForksPage from '@/pages/RepoForksPage';

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 gap-4">
      <img
        src="/Forkling_logo.png"
        alt="Forky the axolotl"
        style={{ width: 96, height: 96 }}
        className="object-contain"
      />
      <h1 className="text-2xl font-extrabold font-headline text-gray-900 dark:text-gray-100">
        Page Not Found
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Forky got lost — this page doesn't exist.
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-accent-gold text-white font-bold rounded-xl hover:bg-accent-gold-dark transition-colors"
      >
        Back to Home
      </a>
    </div>
  );
}

function OfflineBanner() {
  const { isOffline } = useApp();
  if (!isOffline) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 px-4 py-2.5 flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-400 font-medium">
      <FiWifiOff className="text-base flex-shrink-0" />
      <span>You're offline — Forky is showing cached data. Some features may be limited.</span>
    </div>
  );
}

function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0B0D11] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Fixed top nav */}
      <Navbar />

      {/* Rate limit banner sits just below fixed nav */}
      <div className="pt-[108px]">
        <OfflineBanner />
        <RateLimitBanner />
      </div>

      {/* Main content */}
      <main className="flex-1">
        <Routes>
          {/* Home — repo browsing experience */}
          <Route path="/" element={<HomePage />} />

          {/* Compare — 3-slot repo comparison */}
          <Route path="/compare" element={<ComparePage />} />

          {/* Contributor Guide — static editorial content */}
          <Route path="/guide" element={<GuidePage />} />

          {/* LLM Explorer */}
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/models/:modelId" element={<ModelDetailPage />} />

          {/* Repo detail — nested tabbed layout */}
          <Route path="/repo/:owner/:repoName" element={<RepoLayout />}>
            <Route index element={<RepoOverviewPage />} />
            <Route path="contributors" element={<RepoContributorsPage />} />
            <Route path="network" element={<RepoNetworkPage />} />
            <Route path="analytics" element={<RepoAnalyticsPage />} />
            <Route path="issues" element={<RepoIssuesPage />} />
            <Route path="governance" element={<RepoGovernancePage />} />
            <Route path="forks" element={<RepoForksPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
      <ScrollButtons />
      <SettingsModal />
      <CustomCursor />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  );
}
