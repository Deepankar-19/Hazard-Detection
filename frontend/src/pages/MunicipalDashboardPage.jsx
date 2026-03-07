import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { ReportService } from '../services/api';
import { Spinner } from '../components/ui/Spinner';

const COLORS = ['#ef4444', '#f97316', '#22c55e', '#3b82f6', '#a855f7'];

export default function MunicipalDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sumData, wardData] = await Promise.all([
        ReportService.getDashboardSummary(),
        ReportService.getWardPerformance()
      ]);
      setSummary(sumData);
      setWards(wardData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) return <Spinner size="lg" className="mt-20 mx-auto" />;

  const pieData = [
    { name: 'Unresolved', value: summary.unresolved_hazards },
    { name: 'Verified', value: summary.verified_hazards }
  ];

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-300">
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="text-primary-600" />
          Dashboard
        </h2>
        <p className="text-gray-500 text-sm mt-1">Platform overview and repair metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Hazards</div>
          <div className="text-2xl font-black text-gray-900">{summary.total_hazards}</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100">
          <div className="flex items-center gap-1 text-red-600 text-xs font-bold uppercase mb-1">
            <AlertTriangle size={14} /> Severe
          </div>
          <div className="text-2xl font-black text-red-700">{summary.severe_hazards}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-1 text-gray-500 text-xs font-bold uppercase mb-1">
            <Clock size={14} /> Avg Repair
          </div>
          <div className="text-2xl font-black text-gray-900">
            {summary.average_repair_time_days ? `${summary.average_repair_time_days} d` : 'N/A'}
          </div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-100">
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold uppercase mb-1">
            <CheckCircle2 size={14} /> Verified
          </div>
          <div className="text-2xl font-black text-emerald-700">{summary.verified_hazards}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        
        {/* Resolution Pie */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Completion Status</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#f97316" /> {/* Unresolved */}
                  <Cell fill="#22c55e" /> {/* Verified */}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-sm font-medium">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> Pending</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /> Verified</div>
          </div>
        </div>

        {/* Ward Performance Bar */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-4">Hazards by Ward</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={wards} layout="vertical" margin={{ left: 20 }}>
                 <XAxis type="number" hide />
                 <YAxis dataKey="ward" type="category" axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                 <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                 <Bar dataKey="total_hazards" name="Total Hazards" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                    {wards.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>

    </div>
  );
}
