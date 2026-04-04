import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStats } from '@/hooks/useStats';
import { Layout } from '@/components/Layout';
import FeedPage from '@/pages/FeedPage';
import ValidatorPage from '@/pages/ValidatorPage';
import ValidatorsPage from '@/pages/ValidatorsPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ReportsPage from '@/pages/ReportsPage';
import ReportDetailPage from '@/pages/ReportDetailPage';
import CheckPage from '@/pages/CheckPage';
import DevelopersPage from '@/pages/DevelopersPage';

function AppRoutes() {
  const { stats } = useStats();

  return (
    <Layout stats={stats}>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/validators" element={<ValidatorsPage />} />
        <Route path="/rankings" element={<LeaderboardPage />} />
        <Route path="/leaderboard" element={<Navigate to="/rankings" replace />} />
        <Route path="/check" element={<CheckPage />} />
        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/validator/:network/:address" element={<ValidatorPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:providerSlug" element={<ReportDetailPage />} />
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
