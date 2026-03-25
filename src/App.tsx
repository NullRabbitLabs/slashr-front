import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStats } from '@/hooks/useStats';
import { Layout } from '@/components/Layout';
import FeedPage from '@/pages/FeedPage';
import ValidatorPage from '@/pages/ValidatorPage';
import ValidatorsPage from '@/pages/ValidatorsPage';

function AppRoutes() {
  const { stats } = useStats();

  return (
    <Layout stats={stats}>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/validators" element={<ValidatorsPage />} />
        <Route path="/validator/:network/:address" element={<ValidatorPage />} />
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
