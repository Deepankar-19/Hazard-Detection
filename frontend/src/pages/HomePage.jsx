import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Map as MapIcon, Award, ShieldCheck, Bell, FileText, Clock, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ReportService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const STATUS_STYLES = {
  reported: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'Reported' },
  under_review: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Under Review' },
  verified: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Verified' },
  resolved_unverified: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', label: 'Fix Pending' },
};

export default function HomePage() {
  const { user, role } = useStore();
  const [myReports, setMyReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'notifications'

  useEffect(() => {
    ReportService.getMyReports().then(setMyReports).catch(console.error);
    ReportService.getNotifications().then(setNotifications).catch(console.error);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Premium Welcome Hero */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
        <div className="relative z-10">
          <p className="text-sm font-semibold text-slate-500 mb-1">Welcome back,</p>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.username}</h2>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              {role === 'admin' ? 'Authority Portal' : 'Citizen Platform'}
            </p>
          </div>
        </div>
        <div className="relative z-10 text-right bg-primary-50/50 p-3 rounded-2xl border border-primary-100/50 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-1">Guard Points</p>
          <div className="flex items-center justify-end gap-1.5 text-slate-900 font-black text-3xl tracking-tighter">
            <Award size={24} className="text-primary-500 fill-primary-100" />
            {user.points}
          </div>
        </div>
      </div>

      {/* Primary Action CTA - Sleek Gradient */}
      {role !== 'admin' && (
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600 rounded-3xl p-1 text-white shadow-xl shadow-primary-500/25 overflow-hidden relative group transform transition active:scale-[0.98]">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-20 transform group-hover:rotate-12 transition-transform duration-700">
          <Camera size={180} strokeWidth={1} />
        </div>
        
        <div className="relative p-7 z-10 flex flex-col items-start gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/20 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Live Detection
            </div>
            <h3 className="text-3xl font-black mb-1.5 tracking-tight text-white drop-shadow-sm">See a Hazard?</h3>
            <p className="text-primary-50 font-medium text-sm max-w-[200px] leading-relaxed opacity-90">Help keep your community safe by reporting road issues.</p>
          </div>
          <Link 
            to="/report" 
            className="bg-white text-primary-700 px-6 py-3.5 rounded-2xl font-bold w-full flex items-center justify-between group-hover:bg-slate-50 transition-all shadow-md mt-2"
          >
            <span className="flex items-center gap-2 text-base">
              <Camera size={20} className="text-primary-500" />
              Report Engine
            </span>
            <ChevronRight size={20} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
          </Link>
        </div>
      </div>
      )}

      {/* Quick Actions Grid */}
      <div className="px-1">
        <h3 className="font-bold text-slate-800 text-lg mb-3 tracking-tight">Explore Platform</h3>
        <div className="grid grid-cols-2 gap-3">
          
          <Link to="/map" className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col gap-3.5 hover:shadow-md hover:border-slate-200 active:scale-95 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center border border-blue-100/50 group-hover:scale-110 transition-transform">
              <MapIcon size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 leading-tight">Hazard Map</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-1">View risk zones</p>
            </div>
          </Link>
          
          {role !== 'admin' && (
            <>
              <Link to="/verify" className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col gap-3.5 hover:shadow-md hover:border-slate-200 active:scale-95 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 group-hover:scale-110 transition-transform">
                   <ShieldCheck size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">Verify Repairs</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Earn bonus points</p>
                </div>
              </Link>

              <Link to="/leaderboard" className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col gap-3.5 hover:shadow-md hover:border-slate-200 active:scale-95 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50 text-purple-600 flex items-center justify-center border border-purple-100/50 group-hover:scale-110 transition-transform">
                   <Award size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">Leaderboard</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Top reporters</p>
                </div>
              </Link>
            </>
          )}
          
          {role === 'admin' && (
            <Link to="/dashboard" className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col gap-3.5 hover:shadow-md hover:border-slate-200 active:scale-95 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 text-orange-600 flex items-center justify-center border border-orange-100/50 group-hover:scale-110 transition-transform">
                <FileText size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 leading-tight">Admin Portal</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Manage network</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs: My Reports / Notifications */}
      <div className="pt-2">
        <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-2xl mb-4">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'reports' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <FileText size={16} /> My Activity ({myReports.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all relative ${
              activeTab === 'notifications' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Bell size={16} /> Alerts
            {unreadCount > 0 && (
              <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>

        {/* My Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {myReports.length > 0 ? myReports.map((report) => {
              const style = STATUS_STYLES[report.status] || STATUS_STYLES.reported;
              return (
                <div key={report.id} className="bg-white rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 p-4 hover:border-slate-200 transition-colors">
                  <div className="flex gap-4">
                    <img 
                      src={report.image_url} 
                      alt="Hazard" 
                      className="w-16 h-16 rounded-2xl object-cover bg-slate-100 shrink-0 border border-slate-200/50"
                    />
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="font-bold text-slate-900 capitalize tracking-tight truncate pr-2">
                          {report.hazard_type?.replace(/_/g, ' ')}
                        </h4>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{report.ward} • {report.created_at ? formatDistanceToNow(new Date(report.created_at), { addSuffix: true }) : 'Recently'}</p>
                      <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-100 border-dashed">
                        {report.points_earned > 0 && (
                          <span className="text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">+{report.points_earned} pts</span>
                        )}
                        <span className="text-[11px] font-medium text-slate-500">Est. ₹{(report.repair_cost_estimate/1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                  {report.admin_notes && (
                    <div className="mt-3.5 bg-slate-50 rounded-2xl p-3.5 text-xs text-slate-700 flex items-start gap-2.5 border border-slate-100">
                      <AlertCircle size={16} className="shrink-0 text-slate-400 mt-0.5" />
                      <span className="leading-relaxed"><b className="text-slate-900 font-bold">Admin Note:</b> {report.admin_notes}</span>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <FileText size={40} className="mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
                <p className="text-slate-600 font-bold">No reports yet</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Your approved reports will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {notifications.length > 0 ? notifications.map((notif) => (
              <div key={notif.id} className={`rounded-3xl p-4 transition-colors ${
                notif.read ? 'bg-white border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]' : 'bg-primary-50/30 border border-primary-100 shadow-sm'
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    notif.type === 'points_earned' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
                    notif.type === 'repair_complete' ? 'bg-purple-50 text-purple-600 border-purple-100/50' :
                    'bg-primary-50 text-primary-600 border-primary-100/50'
                  }`}>
                    {notif.type === 'points_earned' ? <Award size={20} strokeWidth={2.5} /> :
                     notif.type === 'repair_complete' ? <CheckCircle2 size={20} strokeWidth={2.5} /> :
                     <Bell size={20} strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`font-bold text-sm tracking-tight ${notif.read ? 'text-slate-800' : 'text-slate-900'}`}>{notif.title}</h4>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5 shadow-sm shadow-primary-500/50"></div>}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${notif.read ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>{notif.body}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock size={10} />
                      {notif.created_at ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <Bell size={40} className="mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
                <p className="text-slate-600 font-bold">You're all caught up</p>
                <p className="text-xs text-slate-500 font-medium mt-1">No pending alerts right now.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
    </div>
  );
}
