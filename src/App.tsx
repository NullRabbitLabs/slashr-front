import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStats } from '@/hooks/useStats';
import { AuthProvider } from '@/hooks/useAuth';
import LoginPage from '@/pages/LoginPage';
import AuthVerifyPage from '@/pages/AuthVerifyPage';
import AccountPage from '@/pages/AccountPage';
import { RequireAuth } from '@/components/RequireAuth';
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
        {/* Public: landing, live feed, wallet check stay open for funnel/SEO */}
        <Route path="/" element={<OverviewPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/check" element={<CheckPage />} />

        {/* Gated: require login (risk intelligence + dev/API surface) */}
        <Route path="/risk" element={<RequireAuth><RiskPage /></RequireAuth>} />
        <Route path="/validators" element={<RequireAuth><ValidatorsPage /></RequireAuth>} />
        <Route path="/validator/:network/:address" element={<RequireAuth><ValidatorPage /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><ReportsApiPage /></RequireAuth>} />
        <Route path="/reports/providers" element={<RequireAuth><ReportsPage /></RequireAuth>} />
        <Route path="/reports/:providerSlug" element={<RequireAuth><ReportDetailPage /></RequireAuth>} />
        <Route path="/rankings" element={<RequireAuth><LeaderboardPage /></RequireAuth>} />
        <Route path="/insights" element={<RequireAuth><InsightsPage /></RequireAuth>} />
        <Route path="/developers" element={<RequireAuth><DevelopersPage /></RequireAuth>} />

        {/* Validator short-link redirect (resolves then lands on gated profile) */}
        <Route path="/v/:code" element={<ShortRedirect />} />
        <Route path="/leaderboard" element={<Navigate to="/rankings" replace />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/alerts/verify" element={<AlertsVerifyPage />} />
        <Route path="/alerts/unsubscribe" element={<AlertsUnsubscribePage />} />
        <Route path="/alerts/manage" element={<AlertsManagePage />} />

        {/* User auth (passwordless magic link) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/verify" element={<AuthVerifyPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
