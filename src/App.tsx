import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FeedPage from '@/pages/FeedPage';
import ValidatorPage from '@/pages/ValidatorPage';
import ValidatorsPage from '@/pages/ValidatorsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/validators" element={<ValidatorsPage />} />
        <Route path="/validator/:network/:address" element={<ValidatorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
