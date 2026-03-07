import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto relative shadow-2xl overflow-hidden">
      {/* Top Header */}
      <header className="bg-primary-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary-600 font-bold text-xl">
            R
          </div>
          <h1 className="text-xl font-bold tracking-tight">RoadGuard</h1>
        </div>
      </header>

      {/* Main Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 p-4">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
