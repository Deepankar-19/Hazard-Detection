import { NavLink } from 'react-router-dom';
import { Home, Camera, Map, Award, LayoutDashboard, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function BottomNav() {
  const { role, logout } = useStore();

  const routes = [
    { path: '/', icon: Home, label: 'Home' },
    ...(role !== 'admin' ? [{ path: '/report', icon: Camera, label: 'Report' }] : []),
    { path: '/map', icon: Map, label: 'Map' },
    ...(role !== 'admin' ? [{ path: '/leaderboard', icon: Award, label: 'Rank' }] : []),
    ...(role === 'admin' ? [{ path: '/dashboard', icon: LayoutDashboard, label: 'Gov' }] : []),
  ];

  return (
    <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 safe-area-pb z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {routes.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors
              ${isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'}`
            }
          >
            <Icon size={24} strokeWidth={2} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={24} strokeWidth={2} />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}

