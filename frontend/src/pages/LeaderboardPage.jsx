import { useEffect, useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { ReportService } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { useStore } from '../store/useStore';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useStore();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await ReportService.getLeaderboard(user.city);
      setLeaders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner size="lg" className="mt-20 mx-auto" />;

  return (
    <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      <div className="text-center space-y-2 mb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-full flex items-center justify-center shadow-lg mb-2">
          <Trophy size={32} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Top Guards</h2>
        <p className="text-gray-500 font-medium">Rankings for {user.city}</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {leaders.map((leader, idx) => {
          const isMe = leader.username === user.username;
          
          let RankIcon = null;
          if (idx === 0) RankIcon = <Medal className="text-yellow-500" size={24} />;
          else if (idx === 1) RankIcon = <Medal className="text-gray-400" size={24} />;
          else if (idx === 2) RankIcon = <Medal className="text-orange-400" size={24} />;
          else RankIcon = <span className="text-gray-400 font-bold w-6 text-center">{idx + 1}</span>;

          return (
            <div 
              key={idx} 
              className={`flex items-center p-4 border-b border-gray-50 last:border-0 transition-colors
                ${isMe ? 'bg-primary-50/50 relative' : 'hover:bg-gray-50'}
              `}
            >
              {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />}
              
              <div className="w-12 flex justify-center shrink-0">{RankIcon}</div>
              
              <div className="flex-1 ml-4">
                <p className={`font-bold ${isMe ? 'text-primary-700' : 'text-gray-900'}`}>
                  {leader.username}
                  {isMe && <span className="ml-2 text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                </p>
              </div>

              <div className="flex items-center gap-1.5 font-bold text-gray-700 shrink-0">
                <Award size={16} className={isMe ? 'text-primary-600 fill-primary-100' : 'text-yellow-500 fill-yellow-100'} />
                {leader.points}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
