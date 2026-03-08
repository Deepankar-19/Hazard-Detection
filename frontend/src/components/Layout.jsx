import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useStore } from '../store/useStore';
import { UserCircle } from 'lucide-react';

export default function Layout() {
  const { role } = useStore();

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-slate-200/50">
      {/* Top Header - Glassmorphic */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 p-4 sticky top-0 z-20 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-indigo-800 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-primary-500/20">
            R
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">RoadGuard</h1>
            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-0.5">
              {role === 'admin' ? 'Authority Portal' : 'Citizen Platform'}
            </p>
          </div>
        </div>
        
        {/* Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
          <UserCircle size={20} />
        </div>
      </header>

      {/* Main Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 p-4">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
