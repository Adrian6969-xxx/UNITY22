import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FaskesDashboard from './pages/FaskesDashboard';
import CommandCenter from './pages/CommandCenter';
import LiteracyPortal from './pages/LiteracyPortal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/faskes" element={<FaskesDashboard />} />
        <Route path="/komando" element={<CommandCenter />} />
        <Route path="/literasi" element={<LiteracyPortal />} />
      </Routes>
    </BrowserRouter>
  );
}
