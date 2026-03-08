import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ReportHazardPage from './pages/ReportHazardPage';
import HazardMapPage from './pages/HazardMapPage';
import VerificationPage from './pages/VerificationPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MunicipalDashboardPage from './pages/MunicipalDashboardPage';
import LoginPage from './pages/LoginPage';
import { useStore } from './store/useStore';

function App() {
  const { role } = useStore();

  // Not logged in — show login/role selection
  if (!role) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        {role !== 'admin' && <Route path="report" element={<ReportHazardPage />} />}
        <Route path="map" element={<HazardMapPage />} />
        {role !== 'admin' && <Route path="verify" element={<VerificationPage />} />}
        {role !== 'admin' && <Route path="leaderboard" element={<LeaderboardPage />} />}
        {role === 'admin' && (
          <Route path="dashboard" element={<MunicipalDashboardPage />} />
        )}
      </Route>
    </Routes>
  );
}

export default App;

