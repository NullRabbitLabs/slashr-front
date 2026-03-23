import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FeedPage from '@/pages/FeedPage';
import ValidatorPage from '@/pages/ValidatorPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/validator/:network/:address" element={<ValidatorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
