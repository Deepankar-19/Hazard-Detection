import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, AlertTriangle, Clock, CheckCircle2, X, Check, DollarSign, Wrench, Shield, MapIcon } from 'lucide-react';
import { ReportService } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#ef4444', '#f97316', '#10b981', '#6366f1', '#8b5cf6'];

export default function MunicipalDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [wards, setWards] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [repairCosts, setRepairCosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'queue' | 'costs'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sumData, wardData, queueData, costData] = await Promise.all([
        ReportService.getDashboardSummary(),
        ReportService.getWardPerformance(),
        ReportService.getVerificationQueue(),
        ReportService.getRepairCosts(),
      ]);
      setSummary(sumData);
      setWards(wardData);
      setVerificationQueue(queueData);
      setRepairCosts(costData);
      
      // Also fetch recent hazards
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          const hazards = await ReportService.getHazards(latitude, longitude, 50000);
          setRecentReports(hazards.filter(h => h.hazard_type !== 'municipality_center').slice(0, 10));
        }, async () => {
          const hazards = await ReportService.getHazards(13.0827, 80.2707, 50000);
          setRecentReports(hazards.filter(h => h.hazard_type !== 'municipality_center').slice(0, 10));
        });
      } else {
        const hazards = await ReportService.getHazards(13.0827, 80.2707, 50000);
        setRecentReports(hazards.filter(h => h.hazard_type !== 'municipality_center').slice(0, 10));
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, action) => {
    try {
      await ReportService.verifyHazard(id, action);
    } catch (e) { console.error(e); }
    setVerificationQueue(prev => prev.filter(q => q.id !== id));
  };

  const handleAssignRepair = async (id) => {
    try {
      await ReportService.assignRepair(id, 'high');
      alert('✅ Repair assigned to Metro Roads Pvt Ltd!');
    } catch (e) { console.error(e); }
  };

  if (loading || !summary) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;

  const pieData = [
    { name: 'Unresolved', value: summary.unresolved_hazards },
    { name: 'Verified', value: summary.verified_hazards }
  ];

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      
      {/* Premium Header */}
      <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-1 tracking-tight">
            <span className="bg-orange-100/50 p-1.5 rounded-lg text-orange-600">
              <Shield size={20} />
            </span>
            Command Center
          </h2>
          <p className="text-slate-500 text-xs font-medium">Urban hazard administration</p>
        </div>
        <div className="w-12 h-12 rounded-full border border-slate-200 overflow-hidden shrink-0 shadow-sm">
           <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" alt="Admin" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Modern Pill Tabs */}
      <div className="flex gap-1.5 bg-slate-200/50 p-1.5 rounded-2xl mx-1">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'queue', label: `Queue (${verificationQueue.length})`, icon: AlertTriangle },
          { key: 'costs', label: 'Costs', icon: DollarSign },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[11px] font-bold transition-all ${
              activeSection === key 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════ */}
      {activeSection === 'overview' && (
        <div className="space-y-4 px-1">
          {/* Subtle KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Total Issues</div>
              <div className="text-3xl font-black text-slate-800 tracking-tight">{summary.total_hazards}</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-red-100/50">
              <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase tracking-widest mb-1.5">
                <AlertTriangle size={12} /> Critical
              </div>
              <div className="text-3xl font-black text-red-600 tracking-tight">{summary.severe_hazards}</div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                <Clock size={12} /> Resolution
              </div>
              <div className="text-3xl font-black text-slate-800 tracking-tight">
                {summary.average_repair_time_days ? `${summary.average_repair_time_days}d` : '--'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-emerald-100/50">
              <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1.5">
                <CheckCircle2 size={12} /> Verified
              </div>
              <div className="text-3xl font-black text-emerald-600 tracking-tight">{summary.verified_hazards}</div>
            </div>
          </div>

          {/* Clean Charts */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-5 tracking-tight">Network Status</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#f97316" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex text-center justify-center gap-6 mt-2">
                <div>
                  <div className="flex justify-center items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" /> Pending
                  </div>
                  <p className="text-lg font-black text-slate-800 mt-1">{summary.unresolved_hazards}</p>
                </div>
                <div>
                  <div className="flex justify-center items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" /> Verified
                  </div>
                  <p className="text-lg font-black text-slate-800 mt-1">{summary.verified_hazards}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
               <h3 className="font-bold text-slate-800 mb-6 tracking-tight">Regional Workload</h3>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={wards} layout="vertical" margin={{ left: 20 }}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="ward" type="category" axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 'bold', fill: '#64748b' }} dx={-10} />
                     <Tooltip cursor={{ fill: '#f1f5f9', radius: 8 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                     <Bar dataKey="total_hazards" name="Reports" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24}>
                        {wards.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 tracking-tight">Recent Activity</h3>
            <div className="space-y-3">
              {recentReports.length > 0 ? recentReports.map((report) => (
                <div key={report.id} className="flex gap-4 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 items-center hover:bg-slate-50 transition-colors">
                  <img 
                    src={report.image_url} 
                    alt="Hazard" 
                    className="w-14 h-14 rounded-xl object-cover bg-slate-200 shrink-0 border border-slate-200/50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900 truncate capitalize tracking-tight text-sm">
                        {report.hazard_type?.replace(/_/g, ' ')}
                      </h4>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        report.severity_score === 'HIGH' ? 'bg-red-50 text-red-600' :
                        report.severity_score === 'MEDIUM' ? 'bg-orange-50 text-orange-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {report.severity_score}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 flex justify-between tracking-tight">
                      <span className="truncate">{report.ward || 'Unknown location'}</span>
                      <span className="shrink-0 ml-2">{report.created_at ? formatDistanceToNow(new Date(report.created_at), { addSuffix: true }) : 'Recently'}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm font-medium text-slate-400 text-center py-4">No recent activity detected.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ VERIFICATION QUEUE TAB ══════════════ */}
      {activeSection === 'queue' && (
        <div className="space-y-4 px-1">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100/50 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm shadow-orange-100/20">
            <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-orange-900 text-sm tracking-tight mb-0.5">Priority Queue</p>
              <p className="text-[11px] text-orange-700/80 font-medium">Verify structural issues pending contractor assignment.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {verificationQueue.length > 0 ? verificationQueue.map((item) => (
              <div key={item.id} className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden group hover:border-slate-200 transition-all">
                <div className="relative h-44 w-full">
                  <img src={item.image_url} alt="Hazard" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"></div>
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <div className="bg-slate-900/40 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-lg border border-white/10">
                      AI {(item.ai_confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className={`absolute top-3 right-3 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-lg shadow-sm ${
                    item.severity_score === 'HIGH' ? 'bg-red-500 text-white shadow-red-500/20' :
                    item.severity_score === 'MEDIUM' ? 'bg-orange-500 text-white shadow-orange-500/20' :
                    'bg-emerald-500 text-white shadow-emerald-500/20'
                  }`}>
                    {item.severity_score} PRIORITY
                  </div>

                  {/* Bottom Text inside Image */}
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="font-black text-xl tracking-tight leading-tight capitalize mb-1">{item.hazard_type.replace(/_/g, ' ')}</h3>
                    <div className="flex justify-between items-center text-xs font-semibold text-white/90">
                      <span className="flex items-center gap-1.5"><MapIcon size={12} /> {item.ward}</span>
                      <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md">₹{item.repair_cost_estimate?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Reported by {item.reported_by}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {item.created_at ? formatDistanceToNow(new Date(item.created_at)) + ' ago' : 'Recently'}</span>
                  </div>

                  <div className="flex gap-2.5">
                    <button 
                      onClick={() => handleVerify(item.id, 'reject')}
                      className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-xl font-bold flex justify-center items-center gap-2 text-xs hover:bg-red-50 hover:text-red-600 active:scale-[0.98] transition-all border border-slate-100"
                    >
                      <X size={16} strokeWidth={3} /> Reject
                    </button>
                    <button 
                      onClick={() => handleAssignRepair(item.id)}
                      className="bg-indigo-50 text-indigo-600 py-3 px-3.5 rounded-xl font-bold flex justify-center items-center gap-2 text-xs hover:bg-indigo-100 active:scale-[0.98] transition-all border border-indigo-100"
                      title="Dispatch Contractor"
                    >
                      <Wrench size={16} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => handleVerify(item.id, 'approve')}
                      className="flex-1 bg-indigo-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 text-xs hover:bg-indigo-600 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                    >
                      <Check size={16} strokeWidth={3} /> Verify & Submit
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500" strokeWidth={2} />
                </div>
                <p className="text-slate-800 font-bold text-lg tracking-tight">Queue Cleared</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">All reports have been verified.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ REPAIR COSTS TAB ══════════════ */}
      {activeSection === 'costs' && repairCosts && (
        <div className="space-y-4 px-1">
          {/* Executive Budget Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white p-4 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 text-center flex flex-col items-center justify-center">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Est. Total</p>
              <p className="text-lg font-black text-slate-800 tracking-tight">₹{(repairCosts.total_estimated_cost / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-gradient-to-b from-orange-50/50 to-white p-4 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-orange-100/50 text-center flex flex-col items-center justify-center">
              <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest mb-1.5">Spent</p>
              <p className="text-lg font-black text-orange-600 tracking-tight">₹{(repairCosts.total_spent / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-gradient-to-b from-emerald-50/50 to-white p-4 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-emerald-100/50 text-center flex flex-col items-center justify-center">
              <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-1.5">Remaining</p>
              <p className="text-lg font-black text-emerald-600 tracking-tight">₹{(repairCosts.remaining_budget / 1000).toFixed(0)}K</p>
            </div>
          </div>

          {/* Micro Analytics - Cost by Type */}
          <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-5 tracking-tight">Expenditure by Type</h3>
            <div className="space-y-4">
              {repairCosts.by_type?.map((item, i) => (
                <div key={item.hazard_type} className="group">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="font-bold text-xs text-slate-800 capitalize tracking-tight flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                       {item.hazard_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.count} items</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all group-hover:opacity-80" 
                      style={{ 
                        width: `${(item.total_cost / repairCosts.total_estimated_cost) * 100}%`,
                        backgroundColor: COLORS[i % COLORS.length] 
                      }} 
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] font-medium text-slate-500">Vol: ₹{item.total_cost.toLocaleString()}</span>
                    <span className="text-[10px] font-medium text-slate-500">Avg: ₹{item.avg_cost.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Macro Analytics - Ward Distribution */}
          <div className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 tracking-tight">District Allocations</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repairCosts.by_ward} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="ward" type="category" axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 'bold', fill: '#64748b' }} dx={-10} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9', radius: 8 }} 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                    labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '2px' }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                  />
                  <Bar dataKey="total_cost" name="Predicted" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={8} />
                  <Bar dataKey="resolved_cost" name="Actual" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-3">
              <div className="flex justify-center items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-slate-300" /> Predicted
              </div>
              <div className="flex justify-center items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-indigo-500" /> Actual
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
