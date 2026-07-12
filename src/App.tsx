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
        {/* Public: landing, risk index, live feed, wallet check (funnel/SEO) */}
        <Route path="/" element={<OverviewPage />} />
        <Route path="/risk" element={<RiskPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/check" element={<CheckPage />} />

        {/* Public read surface — ungated for SEO/discovery. The API keeps its
            Bearer floor (served via the edge service token) and account
            features (alerts, keys) stay gated below. */}
        <Route path="/validators" element={<ValidatorsPage />} />
        <Route path="/validator/:network/:address" element={<ValidatorPage />} />
        <Route path="/reports" element={<ReportsApiPage />} />
        <Route path="/reports/providers" element={<ReportsPage />} />
        <Route path="/reports/:providerSlug" element={<ReportDetailPage />} />
        <Route path="/rankings" element={<LeaderboardPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/developers" element={<DevelopersPage />} />

        {/* Validator short-link redirect (resolves then lands on the public profile) */}
        <Route path="/v/:code" element={<ShortRedirect />} />
        <Route path="/leaderboard" element={<Navigate to="/rankings" replace />} />
        {/* Alerts: creating one requires login; verify/unsubscribe/manage are
            email-link landings and stay public. */}
        <Route path="/alerts" element={<RequireAuth><AlertsPage /></RequireAuth>} />
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
