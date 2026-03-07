import { Link } from 'react-router-dom';
import { Camera, Map as MapIcon, Award, ShieldCheck, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function HomePage() {
  const { user } = useStore();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Hero */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Welcome back,</p>
          <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Your Guard Points</p>
          <div className="flex items-center gap-1 text-primary-600 font-bold text-2xl">
            <Award size={20} className="fill-primary-100" />
            {user.points}
          </div>
        </div>
      </div>

      {/* Primary Action */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-1 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
          <Camera size={160} />
        </div>
        
        <div className="relative p-6 z-10 flex flex-col items-start gap-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">See a Hazard?</h3>
            <p className="text-primary-100 font-medium">Keep your community safe.</p>
          </div>
          <Link 
            to="/report" 
            className="bg-white text-primary-700 px-6 py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <Camera size={20} />
            Report Now
          </Link>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <h3 className="font-bold text-gray-800 text-lg px-1 pt-2">Explore</h3>
      <div className="grid grid-cols-2 gap-3">
        
        <Link to="/map" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapIcon size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 leading-tight">Hazard Map</h4>
            <p className="text-xs text-gray-500 mt-1">View risk zones</p>
          </div>
        </Link>
        
        <Link to="/verify" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
             <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 leading-tight">Verify Repairs</h4>
            <p className="text-xs text-gray-500 mt-1">Earn bonus points</p>
          </div>
        </Link>

        <Link to="/leaderboard" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
             <Award size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 leading-tight">Leaderboard</h4>
            <p className="text-xs text-gray-500 mt-1">Top reporters</p>
          </div>
        </Link>
        
        <Link to="/dashboard" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
             <Activity size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 leading-tight">Analytics</h4>
            <p className="text-xs text-gray-500 mt-1">Municipal data</p>
          </div>
        </Link>

      </div>
      
    </div>
  );
}
