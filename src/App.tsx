import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStats } from '@/hooks/useStats';
import { Layout } from '@/components/Layout';
import OverviewPage from '@/pages/OverviewPage';
import RiskPage from '@/pages/RiskPage';
import FeedPage from '@/pages/FeedPage';
import ValidatorPage from '@/pages/ValidatorPage';
import ValidatorsPage from '@/pages/ValidatorsPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ReportsApiPage from '@/pages/ReportsApiPage';
import ReportsPage from '@/pages/ReportsPage';
import ReportDetailPage from '@/pages/ReportDetailPage';
import CheckPage from '@/pages/CheckPage';
import DevelopersPage from '@/pages/DevelopersPage';
import AlertsPage from '@/pages/AlertsPage';
import AlertsVerifyPage from '@/pages/AlertsVerifyPage';
import AlertsUnsubscribePage from '@/pages/AlertsUnsubscribePage';
import AlertsManagePage from '@/pages/AlertsManagePage';
import InsightsPage from '@/pages/InsightsPage';
import ShortRedirect from '@/pages/ShortRedirect';

function AppRoutes() {
  const { stats } = useStats();

  return (
    <Layout stats={stats}>
      <Routes>
        {/* Primary nav (redesign) */}
        <Route path="/" element={<OverviewPage />} />
        <Route path="/risk" element={<RiskPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/validators" element={<ValidatorsPage />} />
        <Route path="/reports" element={<ReportsApiPage />} />

        {/* Reports / providers (secondary) */}
        <Route path="/reports/providers" element={<ReportsPage />} />
        <Route path="/reports/:providerSlug" element={<ReportDetailPage />} />

        {/* Validator profile */}
        <Route path="/v/:code" element={<ShortRedirect />} />
        <Route path="/validator/:network/:address" element={<ValidatorPage />} />

        {/* Secondary pages (reachable, off primary nav) */}
        <Route path="/rankings" element={<LeaderboardPage />} />
        <Route path="/leaderboard" element={<Navigate to="/rankings" replace />} />
        <Route path="/check" element={<CheckPage />} />
        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/alerts/verify" element={<AlertsVerifyPage />} />
        <Route path="/alerts/unsubscribe" element={<AlertsUnsubscribePage />} />
        <Route path="/alerts/manage" element={<AlertsManagePage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
