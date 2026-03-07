import { useEffect, useState } from 'react';
import { RefreshCcw, Check, X, ShieldCheck } from 'lucide-react';
import { ReportService } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { useStore } from '../store/useStore';

export default function VerificationPage() {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { location } = useStore();

  useEffect(() => {
    fetchUnverified();
  }, [location]);

  const fetchUnverified = async () => {
    setLoading(true);
    try {
      const lat = location?.lat || 13.0827;
      const lng = location?.lng || 80.2707;
      const data = await ReportService.getUnverifiedHazards(lat, lng);
      setHazards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id, isResolved) => {
    if (isResolved) {
      try {
        await ReportService.confirmRepair(id);
      } catch (err) {
        console.error(err);
      }
    }
    // Remove from UI immediately for snappy UX
    setHazards((prev) => prev.filter((h) => h.id !== id));
  };

  if (loading) {
    return <Spinner size="lg" className="mt-20 mx-auto" />;
  }

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" />
            Verify Repairs
          </h2>
          <p className="text-gray-500 text-sm mt-1">Confirm contractor work and earn points.</p>
        </div>
        <button onClick={fetchUnverified} className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-900 shadow-sm border border-gray-100">
          <RefreshCcw size={20} />
        </button>
      </div>

      {hazards.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300">
           <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
           <p className="text-gray-600 font-medium">No pending repairs near you.</p>
           <p className="text-xs text-gray-400 mt-1">Check back later or explore the map.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {hazards.map((hazard) => (
            <div key={hazard.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transform transition hover:-translate-y-1">
              <div className="relative h-48">
                <img src={hazard.image_url} alt="Hazard Fixed?" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded">
                  Reported: {new Date(hazard.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-lg capitalize">{hazard.hazard_type.replace(/_/g, ' ')}</h3>
                  <p className="text-xs text-gray-500">{hazard.ward || 'Local Road'}</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => handleConfirm(hazard.id, false)}
                    className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all"
                  >
                    <X size={18} /> Not Fixed
                  </button>
                  <button 
                    onClick={() => handleConfirm(hazard.id, true)}
                    className="flex-1 bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-emerald-100 hover:text-emerald-800 active:scale-95 transition-all"
                  >
                    <Check size={18} /> Fixed
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
