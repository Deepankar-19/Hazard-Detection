import { useState } from 'react';
import { Shield, User, LogIn, AlertCircle, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function LoginPage() {
  const { setRole } = useStore();
  const [mode, setMode] = useState(null); // null | 'admin' | 'user'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (username === 'Admin1' && password === 'Admin@123') {
      setRole('admin');
    } else {
      setError('Invalid credentials. Try Admin1 / Admin@123');
    }
  };

  const handleUserLogin = () => {
    setRole('user');
  };

  // Role selection screen
  if (!mode) {
    return (
      <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative dynamic glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>

        <div className="w-full max-w-sm space-y-10 text-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Logo */}
          <div className="space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[28px] mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)] border border-indigo-400/30">
              <span className="text-5xl font-black text-white tracking-tighter shadow-sm">R</span>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-1">RoadGuard</h1>
              <p className="text-indigo-200/70 text-sm font-medium flex items-center justify-center gap-2">
                <Sparkles size={14} className="text-indigo-400" />
                Next-Gen Civic Maintenance
              </p>
            </div>
          </div>

          {/* Role Cards */}
          <div className="space-y-4">
            <button
              onClick={() => setMode('admin')}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex items-center gap-4 text-left hover:bg-white/10 hover:border-indigo-500/30 active:scale-[0.98] transition-all duration-300 group shadow-lg"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                <Shield size={26} className="text-orange-400" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg tracking-tight">Authority Portal</h3>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">Municipal verification & dispatch</p>
              </div>
            </button>

            <button
              onClick={handleUserLogin}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex items-center gap-4 text-left hover:bg-white/10 hover:border-emerald-500/30 active:scale-[0.98] transition-all duration-300 group shadow-lg"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                <User size={26} className="text-emerald-400" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg tracking-tight">Citizen Access</h3>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">Report issues & earn rewards</p>
              </div>
            </button>
          </div>

          <p className="text-slate-500/60 text-[10px] uppercase tracking-[0.2em] font-bold">Hackathon Prototype v1.0</p>
        </div>
      </div>
    );
  }

  // Admin login form
  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>

      <div className="w-full max-w-sm space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
        <button
          onClick={() => { setMode(null); setError(''); }}
          className="text-slate-400 text-sm font-bold flex items-center gap-2 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10 w-fit backdrop-blur-md"
        >
          ← Back
        </button>

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[32px] p-7 shadow-2xl space-y-7">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 border border-orange-300/30">
              <Shield size={32} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Authority Login</h2>
              <p className="text-slate-400 text-xs font-medium mt-1">Authorized municipal personnel only</p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-indigo-200/50 uppercase tracking-widest block mb-2 pl-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all"
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-indigo-200/50 uppercase tracking-widest block mb-2 pl-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-300 text-xs font-bold bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl animate-in shake">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 hover:from-indigo-400 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25 border border-indigo-400/30"
            >
              <LogIn size={20} strokeWidth={2.5} />
              Secure Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
