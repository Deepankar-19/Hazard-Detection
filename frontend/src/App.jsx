import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ReportHazardPage from './pages/ReportHazardPage';
import HazardMapPage from './pages/HazardMapPage';
import VerificationPage from './pages/VerificationPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MunicipalDashboardPage from './pages/MunicipalDashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        
        {/* Placeholder Routes until implemented */}
        <Route path="report" element={<ReportHazardPage />} />
        <Route path="map" element={<HazardMapPage />} />
        <Route path="verify" element={<VerificationPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="dashboard" element={<MunicipalDashboardPage />} />
      </Route>
    </Routes>
  );
}

export default App;
